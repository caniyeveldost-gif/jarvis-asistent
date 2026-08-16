import 'dotenv/config';
import { generateGeminiAudio, parseRequestBody } from './_gemini.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
  }

  try {
    const body = await parseRequestBody(req);
    const { text, voice = 'Kore' } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Mətn daxil edilməyib.' });
    }

    const audioData = await generateGeminiAudio(text, voice);
    if (!audioData) {
      return res.status(200).json({
        audio: null,
        mimeType: null,
        fallback: true,
        message: 'Gemini Audio generasiyası mümkün olmadı, yerli TTS aktivdir.',
      });
    }

    return res.status(200).json({
      audio: audioData.audioBase64,
      mimeType: audioData.mimeType,
      fallback: false,
    });
  } catch (error: any) {
    console.error('TTS endpoint error:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    });
    const errMsg = error?.message || String(error);
    return res.status(500).json({
      error: errMsg.includes('GEMINI_API_KEY') ? errMsg : 'Audio generasiya zamanı xəta baş verdi.',
    });
  }
}
