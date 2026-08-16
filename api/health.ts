export default function handler(_req: any, res: any) {
  res.status(200).json({
    status: 'ok',
    assistant: 'JARVIS Online',
    ttsEngine: 'Gemini AI Voice TTS',
    platform: 'Vercel Serverless',
  });
}
