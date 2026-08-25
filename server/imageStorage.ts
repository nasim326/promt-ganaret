import fs from 'fs';
import path from 'path';
import { DEFAULT_CONFIG } from './config.js';

/**
 * Sanitize a topic string to create a valid Windows & Linux filename.
 * Removes characters: < > : " / \ | ? * and control chars.
 * Replaces spaces and non-alphanumeric chars with hyphens.
 */
export function sanitizeFilename(topic: string): string {
  if (!topic || topic.trim() === '') {
    return 'generated-image';
  }

  // Convert to lowercase and trim
  let safe = topic.trim().toLowerCase();

  // Replace invalid Windows characters: < > : " / \ | ? * and controls
  safe = safe.replace(/[<>:"/\\|?*\x00-\x1F]/g, '');

  // Replace spaces, underscores, and consecutive symbols with a single hyphen
  safe = safe.replace(/[^a-z0-9]+/g, '-');

  // Strip leading and trailing hyphens
  safe = safe.replace(/^-+|-+$/g, '');

  // Truncate to reasonable filename length (e.g. 60 chars)
  if (safe.length > 60) {
    safe = safe.substring(0, 60).replace(/-+$/, '');
  }

  return safe || 'image';
}

/**
 * Ensure image directory exists.
 */
export function ensureImageDir(dirPath: string = DEFAULT_CONFIG.localImageDir): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Generate a unique filename that does not overwrite an existing file.
 * Example: luxury-modern-bedroom.png, luxury-modern-bedroom-2.png, luxury-modern-bedroom-3.png
 */
export function getUniqueFilename(
  topic: string,
  imageDir: string = DEFAULT_CONFIG.localImageDir,
  extension = '.png'
): string {
  ensureImageDir(imageDir);
  const baseName = sanitizeFilename(topic);
  let candidate = `${baseName}${extension}`;
  let counter = 2;

  while (fs.existsSync(path.join(imageDir, candidate))) {
    candidate = `${baseName}-${counter}${extension}`;
    counter++;
  }

  return candidate;
}

/**
 * Check if an image file exists in the directory.
 */
export function doesImageExist(
  filename: string,
  imageDir: string = DEFAULT_CONFIG.localImageDir
): boolean {
  if (!filename) return false;
  return fs.existsSync(path.join(imageDir, filename));
}

/**
 * Save base64 image data to disk.
 */
export async function saveImageToDisk(
  base64Data: string,
  filename: string,
  imageDir: string = DEFAULT_CONFIG.localImageDir
): Promise<string> {
  ensureImageDir(imageDir);
  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(cleanBase64, 'base64');
  const filePath = path.join(imageDir, filename);
  await fs.promises.writeFile(filePath, buffer);
  return filePath;
}

/**
 * Read image file from disk as buffer or stream.
 */
export function getImageFilePath(
  filename: string,
  imageDir: string = DEFAULT_CONFIG.localImageDir
): string | null {
  const filePath = path.join(imageDir, filename);
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  return null;
}
