import path from 'path';

export interface AppConfig {
  // Gemini model configuration (configurable in one place)
  geminiModel: string;
  // Default aspect ratio for images
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  // Maximum automatic retry attempts per topic
  maxAttempts: number;
  // Default maximum images to process in a single run
  maxImagesPerRun: number;
  // Delay between consecutive requests in ms (rate limit safety)
  requestDelayMs: number;
  // Master prompt template
  masterPrompt: string;
  // Configured default Windows path
  windowsImageDir: string;
  // Local storage directory for server file persistence
  localDataDir: string;
  localImageDir: string;
  dbFilePath: string;
}

export const DEFAULT_MASTER_PROMPT = `Create a professional cinematic image about:

{{TOPIC}}`;

export const DEFAULT_CONFIG: AppConfig = {
  // Configurable Gemini model - official recommended image model
  geminiModel: 'gemini-3.1-flash-lite-image',
  aspectRatio: '1:1',
  maxAttempts: 3,
  maxImagesPerRun: 5,
  requestDelayMs: 1200,
  masterPrompt: DEFAULT_MASTER_PROMPT,
  windowsImageDir: 'C:\\GeminiImageBot\\images\\',
  localDataDir: path.resolve(process.cwd(), 'data'),
  localImageDir: path.resolve(process.cwd(), 'data', 'images'),
  dbFilePath: path.resolve(process.cwd(), 'data', 'topics.json'),
};
