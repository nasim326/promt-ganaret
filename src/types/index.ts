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

export interface Stats {
  total: number;
  pending: number;
  processing: number;
  done: number;
  error: number;
}

export interface AppConfig {
  geminiModel: string;
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  maxAttempts: number;
  maxImagesPerRun: number;
  requestDelayMs: number;
  masterPrompt: string;
  windowsImageDir: string;
  localDataDir?: string;
  localImageDir?: string;
  dbFilePath?: string;
}

export type AutomationStatus = 'idle' | 'running' | 'paused' | 'stopped';

export interface AutomationProgress {
  status: AutomationStatus;
  currentTopicId: number | null;
  currentTopicText: string | null;
  currentPrompt: string | null;
  runProcessedCount: number;
  runLimit: number;
  lastError: string | null;
}
