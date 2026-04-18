export const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Exported so tests can clear it between runs.
export const _rateLimitMap = new Map<string, number[]>();

export function isRateLimited(ip: string): boolean {
	const now = Date.now();
	const timestamps = _rateLimitMap.get(ip) ?? [];
	const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
	_rateLimitMap.set(ip, recent);
	if (recent.length >= RATE_LIMIT_MAX) return true;
	recent.push(now);
	_rateLimitMap.set(ip, recent);
	return false;
}
