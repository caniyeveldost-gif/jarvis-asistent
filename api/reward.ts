import { parseRequestBody } from './_gemini.js';
import { getClientIdentifier, addBonusQuestions, getRateLimitStatus, BONUS_PER_AD } from './_rateLimit.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-client-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Check current rate limit status
  if (req.method === 'GET') {
    try {
      const clientId = (req.query?.clientId as string) || '';
      const clientIdentifier = getClientIdentifier(req, clientId);
      const status = getRateLimitStatus(clientIdentifier);
      return res.status(200).json({
        success: true,
        ...status,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Status yoxlanıla bilmədi.' });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
  }

  try {
    const body = await parseRequestBody(req);
    const { clientId, amount } = body;

    const clientIdentifier = getClientIdentifier(req, clientId);
    const bonusToAdd = typeof amount === 'number' && amount > 0 && amount <= 10 ? amount : BONUS_PER_AD;

    const updatedStatus = addBonusQuestions(clientIdentifier, bonusToAdd);

    return res.status(200).json({
      success: true,
      message: `Təbriklər! ${bonusToAdd} əlavə sual balansınıza əlavə edildi.`,
      added: bonusToAdd,
      ...updatedStatus,
    });
  } catch (error: any) {
    console.error('Reward API Error:', error);
    return res.status(500).json({
      error: 'Mükafat əlavə edilərkən xəta baş verdi.',
    });
  }
}
