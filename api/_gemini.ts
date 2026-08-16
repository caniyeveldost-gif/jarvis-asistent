import 'dotenv/config';
import { GoogleGenAI, Modality } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.API_KEY ||
    process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error('[Gemini Client] GEMINI_API_KEY is not defined in environment variables');
    throw new Error(
      'GEMINI_API_KEY tapılmadı. Zəhmət olmasa sistem mühit dəyişənlərində GEMINI_API_KEY qeyd edin.'
    );
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  return geminiClient;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Parse request body for Vercel Serverless / Node.js standard runtime
export async function parseRequestBody(req: any): Promise<any> {
  if (req.body) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
    return req.body;
  }

  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk: any) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'model';
  text: string;
}

// Generate Text Reply from Gemini Models
export async function generateGeminiReply(
  contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  systemInstruction: string
): Promise<string> {
  const client = getGeminiClient();

  // Try gemini-3.7-flash with retry
  const modelsToTry = ['gemini-3.7-flash'];
  let lastError: any = null;

  for (const model of modelsToTry) {
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
        console.warn(`[Gemini Text] Attempt ${attempt + 1} with model ${model} failed: ${errMsg}`);

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
  if (!text) return '';
  return text
    .replace(/[*_~`#>\\]/g, '') // remove markdown symbols
    .replace(/https?:\/\/\S+/g, 'keçid') // replace URLs
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // markdown links
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // remove emojis
    .replace(/\s+/g, ' ') // normalize whitespace
    .trim();
}

// Allowed Gemini TTS voice names
const VALID_VOICES = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

// Generate Audio Speech using Gemini TTS API (gemini-3.1-flash-tts-preview)
// Sticking strictly to the chosen voice (default "Kore") with retries on the exact same voice
export async function generateGeminiAudio(
  text: string,
  voiceName: string = 'Kore'
): Promise<{ audioBase64: string; mimeType: string } | null> {
  const cleanedVoice =
    voiceName && typeof voiceName === 'string' && voiceName.trim()
      ? voiceName.trim()
      : 'Kore';

  const selectedVoice = VALID_VOICES.includes(cleanedVoice) ? cleanedVoice : 'Kore';

  const cleanedText = cleanTextForTTS(text);
  if (!cleanedText) {
    console.warn('[Gemini TTS] Empty text after cleaning, skipping audio generation');
    return null;
  }

  // Ensure prompt text is reasonable length for prompt synthesis
  const truncatedText = cleanedText.length > 1200 ? cleanedText.slice(0, 1200) + '...' : cleanedText;

  console.log(`[Gemini TTS] Requesting audio for ${truncatedText.length} chars using voice "${selectedVoice}"`);

  let client: GoogleGenAI;
  try {
    client = getGeminiClient();
  } catch (err: any) {
    console.error('[Gemini TTS] Client initialization error:', err?.message || err);
    return null;
  }

  // Retry up to 3 times on the EXACT same voice without switching voice models
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: truncatedText,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: selectedVoice,
              },
            },
          },
        },
      });

      const candidate = response.candidates?.[0];
      const audioPart = candidate?.content?.parts?.find((p) => p.inlineData && p.inlineData.data);

      if (audioPart && audioPart.inlineData?.data) {
        console.log(`[Gemini TTS] Audio successfully generated (size: ${audioPart.inlineData.data.length} bytes, voice: ${selectedVoice})`);
        return {
          audioBase64: audioPart.inlineData.data,
          mimeType: audioPart.inlineData.mimeType || 'audio/pcm;rate=24000',
        };
      } else {
        console.warn(`[Gemini TTS] Attempt ${attempt + 1}: response candidate did not contain audio part. Candidate:`, JSON.stringify(candidate));
      }
    } catch (err: any) {
      console.error(
        `[Gemini TTS] Attempt ${attempt + 1} with voice "${selectedVoice}" failed:`,
        {
          name: err?.name,
          message: err?.message,
          status: err?.status,
          code: err?.code,
          stack: err?.stack,
          rawError: typeof err === 'object' ? JSON.stringify(err, Object.getOwnPropertyNames(err)) : String(err),
        }
      );

      if (attempt < 2) {
        // Wait and retry with the exact same voice model
        await sleep(500 * (attempt + 1));
        continue;
      }
    }
  }

  console.error(`[Gemini TTS] Failed to generate audio after 3 attempts with voice "${selectedVoice}"`);
  return null;
}
