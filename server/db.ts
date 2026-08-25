import fs from 'fs';
import path from 'path';
import { AppConfig, DEFAULT_CONFIG } from './config.js';
import { doesImageExist } from './imageStorage.js';

export type TopicStatus = 'Pending' | 'Processing' | 'Done' | 'Error';

export interface TopicItem {
  id: number;
  topic: string;
  status: TopicStatus;
  filename?: string;
  imageUrl?: string;
  error?: string | null;
  attempts: number;
  prompt?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface DatabaseState {
  topics: TopicItem[];
  config: Partial<AppConfig>;
  lastUpdated: number;
}

const SEED_TOPICS: Array<{ topic: string }> = [
  { topic: 'Luxury modern bedroom' },
  { topic: 'Futuristic city at night' },
  { topic: 'Japanese zen garden with koi pond' },
  { topic: 'Cozy wooden cabin in snowy mountains' },
  { topic: 'Cyberpunk neon street market in the rain' },
];

export class LocalDatabase {
  private dbPath: string;
  private dataDir: string;
  private state: DatabaseState;

  constructor(dbPath: string = DEFAULT_CONFIG.dbFilePath, dataDir: string = DEFAULT_CONFIG.localDataDir) {
    this.dbPath = dbPath;
    this.dataDir = dataDir;
    this.state = {
      topics: [],
      config: {
        geminiModel: DEFAULT_CONFIG.geminiModel,
        aspectRatio: DEFAULT_CONFIG.aspectRatio,
        maxAttempts: DEFAULT_CONFIG.maxAttempts,
        maxImagesPerRun: DEFAULT_CONFIG.maxImagesPerRun,
        requestDelayMs: DEFAULT_CONFIG.requestDelayMs,
        masterPrompt: DEFAULT_CONFIG.masterPrompt,
        windowsImageDir: DEFAULT_CONFIG.windowsImageDir,
      },
      lastUpdated: Date.now(),
    };
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.topics)) {
          this.state = parsed;
        }
      } else {
        // Seed initial topics
        const now = Date.now();
        this.state.topics = SEED_TOPICS.map((item, index) => ({
          id: index + 1,
          topic: item.topic,
          status: 'Pending',
          attempts: 0,
          error: null,
          createdAt: now,
          updatedAt: now,
        }));
        this.persist();
      }

      // Resume behavior: If application stopped while row was Processing, reset to Pending
      this.resetProcessingToPending();
    } catch (err) {
      console.error('Failed to initialize local database:', err);
    }
  }

  public resetProcessingToPending(): number {
    let count = 0;
    const now = Date.now();
    for (const t of this.state.topics) {
      if (t.status === 'Processing') {
        t.status = 'Pending';
        t.updatedAt = now;
        count++;
      }
    }
    if (count > 0) {
      this.persist();
    }
    return count;
  }

  public getTopics(): TopicItem[] {
    // Check if any topic with an existing image file is not marked Done
    let updated = false;
    for (const t of this.state.topics) {
      if (t.filename && doesImageExist(t.filename)) {
        if (t.status !== 'Done') {
          t.status = 'Done';
          t.imageUrl = `/api/images/${t.filename}`;
          updated = true;
        }
      }
    }
    if (updated) {
      this.persist();
    }
    return [...this.state.topics];
  }

  public getTopicById(id: number): TopicItem | undefined {
    return this.state.topics.find((t) => t.id === id);
  }

  public addTopic(topicText: string): TopicItem {
    const nextId = this.state.topics.length > 0 
      ? Math.max(...this.state.topics.map((t) => t.id)) + 1 
      : 1;
    const now = Date.now();
    const newTopic: TopicItem = {
      id: nextId,
      topic: topicText.trim(),
      status: 'Pending',
      attempts: 0,
      error: null,
      createdAt: now,
      updatedAt: now,
    };
    this.state.topics.push(newTopic);
    this.persist();
    return newTopic;
  }

  public addMultipleTopics(topicsList: string[]): TopicItem[] {
    const added: TopicItem[] = [];
    let nextId = this.state.topics.length > 0 
      ? Math.max(...this.state.topics.map((t) => t.id)) + 1 
      : 1;
    const now = Date.now();

    for (const text of topicsList) {
      const trimmed = text.trim();
      if (!trimmed) continue;
      const item: TopicItem = {
        id: nextId++,
        topic: trimmed,
        status: 'Pending',
        attempts: 0,
        error: null,
        createdAt: now,
        updatedAt: now,
      };
      this.state.topics.push(item);
      added.push(item);
    }

    this.persist();
    return added;
  }

  public updateTopic(id: number, updates: Partial<TopicItem>): TopicItem | null {
    const item = this.state.topics.find((t) => t.id === id);
    if (!item) return null;

    Object.assign(item, updates, { updatedAt: Date.now() });
    this.persist();
    return item;
  }

  public deleteTopic(id: number): boolean {
    const initialLen = this.state.topics.length;
    this.state.topics = this.state.topics.filter((t) => t.id !== id);
    if (this.state.topics.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  public deleteMultipleTopics(ids: number[]): number {
    const idSet = new Set(ids);
    const initialLen = this.state.topics.length;
    this.state.topics = this.state.topics.filter((t) => !idSet.has(t.id));
    const deletedCount = initialLen - this.state.topics.length;
    if (deletedCount > 0) {
      this.persist();
    }
    return deletedCount;
  }

  public clearTopics(filter?: 'all' | 'done' | 'error'): number {
    const initialLen = this.state.topics.length;
    if (filter === 'done') {
      this.state.topics = this.state.topics.filter((t) => t.status !== 'Done');
    } else if (filter === 'error') {
      this.state.topics = this.state.topics.filter((t) => t.status !== 'Error');
    } else {
      this.state.topics = [];
    }
    const count = initialLen - this.state.topics.length;
    this.persist();
    return count;
  }

  public retryFailed(): number {
    let count = 0;
    const now = Date.now();
    for (const t of this.state.topics) {
      if (t.status === 'Error') {
        t.status = 'Pending';
        t.error = null;
        t.updatedAt = now;
        count++;
      }
    }
    if (count > 0) {
      this.persist();
    }
    return count;
  }

  public getConfig(): Partial<AppConfig> {
    return {
      geminiModel: this.state.config.geminiModel || DEFAULT_CONFIG.geminiModel,
      aspectRatio: this.state.config.aspectRatio || DEFAULT_CONFIG.aspectRatio,
      maxAttempts: this.state.config.maxAttempts || DEFAULT_CONFIG.maxAttempts,
      maxImagesPerRun: this.state.config.maxImagesPerRun || DEFAULT_CONFIG.maxImagesPerRun,
      requestDelayMs: this.state.config.requestDelayMs || DEFAULT_CONFIG.requestDelayMs,
      masterPrompt: this.state.config.masterPrompt || DEFAULT_CONFIG.masterPrompt,
      windowsImageDir: this.state.config.windowsImageDir || DEFAULT_CONFIG.windowsImageDir,
    };
  }

  public updateConfig(newConfig: Partial<AppConfig>): Partial<AppConfig> {
    this.state.config = {
      ...this.state.config,
      ...newConfig,
    };
    this.persist();
    return this.getConfig();
  }

  private persist(): void {
    try {
      this.state.lastUpdated = Date.now();
      fs.writeFileSync(this.dbPath, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write topics to disk:', err);
    }
  }
}

export const db = new LocalDatabase();
