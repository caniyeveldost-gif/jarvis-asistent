import { generateGeminiReply, generateGeminiAudio, ChatHistoryItem } from './_gemini';

export default async function handler(req: any, res: any) {
  // CORS & method check
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { message, history = [], voice = 'Kore' } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Mesaj daxil edilməyib.' });
    }

    const cleanUserQuery = message.trim();

    const systemInstruction = `
Sən J.A.R.V.I.S. (Just A Rather Very Intelligent System) adlı intellektual, kübar, dəqiq və sürətli səsli köməkçisən.
Sən istifadəçinin suallarına aydın, məntiqli və yığcam cavablar verirsən.

Xüsusi qaydalar:
1. ƏSAS DİL: İstifadəçi hansı dildə danışırsa (əsasən Azərbaycan dili, həmçinin Türk, İngilis və ya Rus), həmin dildə səlis və təbii cavab ver.
2. SƏSLİ OXUMAĞA UYĞUNLUQ: Cavabların səsli oxunacaq (Gemini Audio TTS). Buna görə cavablarında mürəkkəb cədvəllər, həddindən artıq ulduz işarələri (***), lazımsız emojilər və ya oxunması çətin kod blokları istifadə etmə. Qısa, aydın, dinləyici üçün xoş və səlis cümlələr qur.
3. TON: Kübar, bilikli, nəzakətli və texnoloji (Jarvis tərzi, məsələn "Buyurun, cənab", "Məlumatı təqdim edirəm", "Əmr edin").
4. YIĞCAMLIQ: Əgər istifadəçi xüsusi olaraq uzun inşa və ya siyahı istəmirsə, cavabları 1-4 cümlə daxilində yığcam saxla ki, dinləyərkən yorucu olmasın.
`.trim();

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

    return res.status(200).json({
      reply: replyText,
      audio: audioData ? audioData.audioBase64 : null,
      mimeType: audioData ? audioData.mimeType : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return res.status(500).json({
      error:
        'Sistem hazırda yüksək yüklənmə altındadır. Xahiş edirəm bir neçə saniyə sonra yenidən cəhd edin.',
    });
  }
}
