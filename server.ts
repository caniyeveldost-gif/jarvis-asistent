import express, { Request, Response } from 'express';
import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini initialization with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'model';
  text: string;
}

// Helper to delay for retries
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Generate Text Reply from Gemini
async function generateGeminiReply(contents: any[], systemInstruction: string): Promise<string> {
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
function cleanTextForTTS(text: string): string {
  return text
    .replace(/[*_~`#>\\]/g, '') // remove markdown marks
    .replace(/https?:\/\/\S+/g, 'keçid') // URLs
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // markdown links
    .replace(/\s+/g, ' ')
    .trim();
}

// Generate Audio Speech using Gemini TTS API (gemini-3.1-flash-tts-preview)
async function generateGeminiAudio(
  text: string,
  voiceName: string = 'Kore'
): Promise<{ audioBase64: string; mimeType: string } | null> {
  try {
    const cleanedText = cleanTextForTTS(text);
    if (!cleanedText) return null;

    // Direct instruction to pronounce Azerbaijani text accurately with natural cadence
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

// Jarvis Chat & Voice Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, history = [], voice = 'Kore' } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Mesaj daxil edilməyib.' });
    }

    const cleanUserQuery = message.trim();

    // Prepare system instructions tailored for a voice assistant
    const systemInstruction = `
Sən J.A.R.V.I.S. (Just A Rather Very Intelligent System) adlı intellektual, kübar, dəqiq və sürətli səsli köməkçisən.
Sən istifadəçinin suallarına aydın, məntiqli və yığcam cavablar verirsən.

Xüsusi qaydalar:
1. ƏSAS DİL: İstifadəçi hansı dildə danışırsa (əsasən Azərbaycan dili, həmçinin Türk, İngilis və ya Rus), həmin dildə səlis və təbii cavab ver.
2. SƏSLİ OXUMAĞA UYĞUNLUQ: Cavabların səsli oxunacaq (Gemini Audio TTS). Buna görə cavablarında mürəkkəb cədvəllər, həddindən artıq ulduz işarələri (***), lazımsız emojilər və ya oxunması çətin kod blokları istifadə etmə. Qısa, aydın, dinləyici üçün xoş və səlis cümlələr qur.
3. TON: Kübar, bilikli, nəzakətli və texnoloji (Jarvis tərzi, məsələn "Buyurun, cənab", "Məlumatı təqdim edirəm", "Əmr edin").
4. YIĞCAMLIQ: Əgər istifadəçi xüsusi olaraq uzun inşa və ya siyahı istəmirsə, cavabları 1-4 cümlə daxilində yığcam saxla ki, dinləyərkən yorucu olmasın.
`.trim();

    // Build properly formatted alternating conversation turns for Gemini
    const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history) && history.length > 0) {
      const validHistory = history
        .filter((item: ChatHistoryItem) => item && typeof item.text === 'string' && item.text.trim())
        .slice(-8);

      let lastRole: 'user' | 'model' | null = null;

      for (const item of validHistory) {
        const itemRole: 'user' | 'model' =
          item.role === 'assistant' || item.role === 'model' ? 'model' : 'user';
        const itemText = item.text.trim();

        if (formattedContents.length === 0 && itemRole !== 'user') {
          continue;
        }

        if (lastRole === itemRole && formattedContents.length > 0) {
          formattedContents[formattedContents.length - 1].parts[0].text += `\n${itemText}`;
        } else {
          formattedContents.push({
            role: itemRole,
            parts: [{ text: itemText }],
          });
          lastRole = itemRole;
        }
      }
    }

    // Append current user query
    if (
      formattedContents.length > 0 &&
      formattedContents[formattedContents.length - 1].role === 'user'
    ) {
      formattedContents[formattedContents.length - 1].parts[0].text = cleanUserQuery;
    } else {
      formattedContents.push({
        role: 'user',
        parts: [{ text: cleanUserQuery }],
      });
    }

    // 1. Generate text answer
    const replyText = await generateGeminiReply(formattedContents, systemInstruction);

    // 2. Generate Gemini Audio TTS for the reply
    const audioData = await generateGeminiAudio(replyText, voice);

    return res.json({
      reply: replyText,
      audio: audioData ? audioData.audioBase64 : null,
      mimeType: audioData ? audioData.mimeType : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({
      error:
        'Sistem hazırda yüksək yüklənmə altındadır. Xahiş edirəm bir neçə saniyə sonra yenidən cəhd edin.',
    });
  }
});

// Dedicated Gemini TTS Endpoint for generating speech for any text
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, voice = 'Kore' } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Mətn daxil edilməyib.' });
    }

    const audioData = await generateGeminiAudio(text, voice);
    if (!audioData) {
      return res.status(500).json({ error: 'Audio generasiya edilə bilmədi.' });
    }

    return res.json({
      audio: audioData.audioBase64,
      mimeType: audioData.mimeType,
    });
  } catch (error: any) {
    console.error('TTS endpoint error:', error);
    return res.status(500).json({ error: 'Audio generasiya zamanı xəta baş verdi.' });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', assistant: 'JARVIS Online', ttsEngine: 'Gemini AI Voice TTS' });
});

// Server setup: Vite dev middleware vs static production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JARVIS Voice Assistant Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
