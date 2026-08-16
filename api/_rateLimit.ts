// In-memory rate limiter for Vercel Serverless / Node.js runtime
// Base limit: 5 questions per user per day + Bonus questions earned from watching ads

interface RateLimitRecord {
  count: number;
  bonus: number;
  date: string; // YYYY-MM-DD
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export const MAX_DAILY_LIMIT = 5;
export const BONUS_PER_AD = 5;

// Clean up old entries periodically to prevent memory leaks
function cleanupStore() {
  const today = getTodayDateString();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.date !== today) {
      rateLimitStore.delete(key);
    }
  }
}

export function getTodayDateString(): string {
  // Use UTC date YYYY-MM-DD
  return new Date().toISOString().slice(0, 10);
}

export function getClientIdentifier(req: any, bodyClientId?: string): string {
  if (bodyClientId && typeof bodyClientId === 'string' && bodyClientId.trim()) {
    return `client_${bodyClientId.trim()}`;
  }

  const customHeader = req.headers?.['x-client-id'];
  if (customHeader && typeof customHeader === 'string' && customHeader.trim()) {
    return `client_${customHeader.trim()}`;
  }

  const xForwardedFor = req.headers?.['x-forwarded-for'];
  if (xForwardedFor) {
    const ip = (typeof xForwardedFor === 'string' ? xForwardedFor : xForwardedFor[0])
      .split(',')[0]
      .trim();
    if (ip) return `ip_${ip}`;
  }

  const realIp = req.headers?.['x-real-ip'];
  if (realIp && typeof realIp === 'string') {
    return `ip_${realIp.trim()}`;
  }

  const remoteAddr = req.socket?.remoteAddress || req.connection?.remoteAddress;
  if (remoteAddr) {
    return `ip_${remoteAddr}`;
  }

  return 'anonymous_client';
}

export function checkAndIncrementRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  limit: number;
  count: number;
  bonus: number;
  message?: string;
} {
  const today = getTodayDateString();

  // Occasional cleanup
  if (rateLimitStore.size > 2000) {
    cleanupStore();
  }

  let record = rateLimitStore.get(identifier);

  if (!record || record.date !== today) {
    record = { count: 0, bonus: 0, date: today };
  }

  const effectiveLimit = MAX_DAILY_LIMIT + (record.bonus || 0);

  if (record.count >= effectiveLimit) {
    return {
      allowed: false,
      remaining: 0,
      limit: effectiveLimit,
      count: record.count,
      bonus: record.bonus || 0,
      message: 'Gündəlik limitiniz bitib, sabah yenidən cəhd edin',
    };
  }

  // Increment usage count
  record.count += 1;
  rateLimitStore.set(identifier, record);

  const remaining = Math.max(0, effectiveLimit - record.count);

  return {
    allowed: true,
    remaining,
    limit: effectiveLimit,
    count: record.count,
    bonus: record.bonus || 0,
  };
}

export function addBonusQuestions(
  identifier: string,
  bonusAmount: number = BONUS_PER_AD
): {
  remaining: number;
  limit: number;
  count: number;
  bonus: number;
} {
  const today = getTodayDateString();
  let record = rateLimitStore.get(identifier);

  if (!record || record.date !== today) {
    record = { count: 0, bonus: bonusAmount, date: today };
  } else {
    record.bonus = (record.bonus || 0) + bonusAmount;
  }

  rateLimitStore.set(identifier, record);

  const effectiveLimit = MAX_DAILY_LIMIT + record.bonus;
  const remaining = Math.max(0, effectiveLimit - record.count);

  return {
    remaining,
    limit: effectiveLimit,
    count: record.count,
    bonus: record.bonus,
  };
}

export function getRateLimitStatus(identifier: string): {
  remaining: number;
  limit: number;
  count: number;
  bonus: number;
} {
  const today = getTodayDateString();
  const record = rateLimitStore.get(identifier);

  if (!record || record.date !== today) {
    return {
      remaining: MAX_DAILY_LIMIT,
      limit: MAX_DAILY_LIMIT,
      count: 0,
      bonus: 0,
    };
  }

  const effectiveLimit = MAX_DAILY_LIMIT + (record.bonus || 0);
  const remaining = Math.max(0, effectiveLimit - record.count);

  return {
    remaining,
    limit: effectiveLimit,
    count: record.count,
    bonus: record.bonus || 0,
  };
}
