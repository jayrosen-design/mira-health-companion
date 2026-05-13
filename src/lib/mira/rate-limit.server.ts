// Ad-hoc in-memory sliding-window rate limiter. Per-instance only.
// Suitable for blocking a single misbehaving client; not a global limit.

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 20; // per window per key
const MAX_KEYS = 10_000; // cap memory

const hits = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  limit: number;
  windowSeconds: number;
}

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const arr = (hits.get(key) ?? []).filter((t) => t > cutoff);

  if (arr.length >= MAX_REQUESTS) {
    hits.set(key, arr);
    const retryMs = WINDOW_MS - (now - arr[0]);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(retryMs / 1000)),
      limit: MAX_REQUESTS,
      windowSeconds: WINDOW_MS / 1000,
    };
  }

  arr.push(now);
  hits.set(key, arr);

  // Light eviction to bound memory
  if (hits.size > MAX_KEYS) {
    for (const [k, v] of hits) {
      if (!v.length || v[v.length - 1] < cutoff) hits.delete(k);
      if (hits.size <= MAX_KEYS) break;
    }
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS - arr.length,
    retryAfterSeconds: 0,
    limit: MAX_REQUESTS,
    windowSeconds: WINDOW_MS / 1000,
  };
}

export function getClientKey(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf;
  return "unknown";
}
