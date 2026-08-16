import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Server-side Gemini initialization with required User-Agent
export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'model';
  text: string;
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Generate Text Reply from Gemini with fast fallback
export async function generateGeminiReply(
  contents: any[],
  systemInstruction: string
): Promise<string> {
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.7-flash'];
  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
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

    const prompt = `Azərbaycan dilində olan bu mətni aydın, səlis və kübar intonasiya ilə oxu: ${cleanedText}`;

    const response = await ai.models.generateContent({
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
