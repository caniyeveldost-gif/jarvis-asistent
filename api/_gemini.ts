import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';

// Safely load dotenv if present (for local dev/Node)
try {
  dotenv.config();
} catch {
  // Ignore in Vercel environment where dotenv is not needed
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'model';
  text: string;
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let cachedClient: GoogleGenAI | null = null;

// Safely resolve Gemini API Key from multiple common environment variable names
export function getGeminiApiKey(): string {
  const key =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    '';
  return key.trim();
}

// Lazy safe initialization of GoogleGenAI client (never crashes on module import)
export function getGeminiClient(): GoogleGenAI {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY tapılmadı. Xahiş edirəm Vercel Environment Variables bölməsində GEMINI_API_KEY təyin edin.'
    );
  }

  cachedClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  return cachedClient;
}

// Helper to safely parse incoming request body on Vercel Serverless & Express
export async function parseRequestBody(req: any): Promise<any> {
  if (!req) return {};

  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  // If body is a readable stream (raw Node request)
  if (typeof req.on === 'function') {
    try {
      const buffers: Uint8Array[] = [];
      for await (const chunk of req) {
        buffers.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const rawText = Buffer.concat(buffers).toString('utf-8');
      return rawText ? JSON.parse(rawText) : {};
    } catch {
      return {};
    }
  }

  return {};
}

// Generate Text Reply from Gemini with automatic fast fallback
export async function generateGeminiReply(
  contents: any[],
  systemInstruction: string
): Promise<string> {
  const client = getGeminiClient();
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.7-flash'];
  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await client.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        if (response && response.text && response.text.trim()) {
          return response.text.trim();
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        console.warn(`Text attempt ${attempt + 1} with model ${model} failed: ${errMsg}`);

        const isTransient =
          errMsg.includes('503') ||
          errMsg.includes('429') ||
          errMsg.includes('high demand') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('RESOURCE_EXHAUSTED');

        if (isTransient && attempt < 2) {
          await sleep(500 * (attempt + 1));
          continue;
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error('Sistem hazırda cavab verə bilmədi.');
}

// Clean text for speech synthesis before sending to Gemini TTS
export function cleanTextForTTS(text: string): string {
  return text
    .replace(/[*_~`#>\\]/g, '')
    .replace(/https?:\/\/\S+/g, 'keçid')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

// Generate Audio Speech using Gemini TTS API (gemini-3.1-flash-tts-preview)
export async function generateGeminiAudio(
  text: string,
  voiceName: string = 'Kore'
): Promise<{ audioBase64: string; mimeType: string } | null> {
  try {
    const cleanedText = cleanTextForTTS(text);
    if (!cleanedText) return null;

    const client = getGeminiClient();
    const prompt = `Azərbaycan dilində olan bu mətni aydın, səlis və kübar intonasiya ilə oxu: ${cleanedText}`;

    const response = await client.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName || 'Kore',
            },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find((p) => p.inlineData && p.inlineData.data);

    if (audioPart && audioPart.inlineData?.data) {
      return {
        audioBase64: audioPart.inlineData.data,
        mimeType: audioPart.inlineData.mimeType || 'audio/pcm;rate=24000',
      };
    }

    return null;
  } catch (err: any) {
    console.warn('Gemini TTS Audio generation error:', err?.message || err);
    return null;
  }
}
