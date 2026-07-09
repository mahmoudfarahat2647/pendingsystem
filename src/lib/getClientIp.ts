// Prefer the platform-trusted `x-real-ip` header, and otherwise take the LAST hop of
// `x-forwarded-for` (the segment appended by our own proxy/edge), never the first —
// the first segment is client-supplied and trivially spoofable, which would let an
// attacker rotate IPs per request to defeat per-IP rate limiting.
export function getClientIp(headers: Headers): string {
	const realIp = headers.get("x-real-ip")?.trim();
	if (realIp) return realIp;
	const xff = headers.get("x-forwarded-for");
	if (xff) {
		const parts = xff
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
		const last = parts.at(-1);
		if (last) return last;
	}
	return "unknown";
}
