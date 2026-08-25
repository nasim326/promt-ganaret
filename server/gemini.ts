import { GoogleGenAI } from '@google/genai';
import { DEFAULT_CONFIG } from './config.js';

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface GenerateImageResult {
  imageBase64: string;
  mimeType: string;
  textFeedback?: string;
}

/**
 * Cleanly format Gemini error messages for user readability
 */
export function formatGeminiError(err: any): string {
  if (!err) return 'Unknown error occurred during image generation.';
  const message = typeof err === 'string' ? err : err.message || JSON.stringify(err);

  try {
    const parsed = JSON.parse(message);
    if (parsed.error) {
      if (parsed.error.code === 429 || parsed.error.status === 'RESOURCE_EXHAUSTED') {
        return `Quota exceeded (429): Image generation requires a Gemini API key with billing enabled. Details: ${parsed.error.message?.split('\n')[0] || 'Resource exhausted'}`;
      }
      return parsed.error.message || message;
    }
  } catch {
    // Not a raw JSON string
  }

  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('quota') || message.includes('429')) {
    return 'Quota limit exceeded (429). Image generation models require a paid Gemini API key. Please ensure your API key has billing enabled.';
  }

  return message;
}

/**
 * Generate an image using Gemini Image Model.
 * One successful topic = one image generation request.
 */
export async function generateGeminiImage(
  prompt: string,
  modelName: string = DEFAULT_CONFIG.geminiModel,
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' = '1:1'
): Promise<GenerateImageResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please check the Secrets panel.');
  }

  const ai = getGeminiClient();

  let response;
  try {
    response = await ai.models.generateContent({
      model: modelName || DEFAULT_CONFIG.geminiModel,
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio || '1:1',
        },
      },
    });
  } catch (err: any) {
    const formatted = formatGeminiError(err);
    const errorObj = new Error(formatted);
    (errorObj as any).raw = err;
    throw errorObj;
  }

  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error('No candidate returned from Gemini image model.');
  }

  const parts = candidates[0].content?.parts;
  if (!parts || parts.length === 0) {
    throw new Error('Empty response parts from Gemini image model.');
  }

  let foundBase64: string | null = null;
  let foundMimeType = 'image/png';
  let textOutput = '';

  for (const part of parts) {
    if (part.inlineData && part.inlineData.data) {
      foundBase64 = part.inlineData.data;
      if (part.inlineData.mimeType) {
        foundMimeType = part.inlineData.mimeType;
      }
    } else if (part.text) {
      textOutput += part.text + ' ';
    }
  }

  if (!foundBase64) {
    throw new Error(
      textOutput.trim() || 'Gemini model did not return image data in the response.'
    );
  }

  return {
    imageBase64: foundBase64,
    mimeType: foundMimeType,
    textFeedback: textOutput.trim() || undefined,
  };
}
