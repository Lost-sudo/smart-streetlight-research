export const ONLINE_WINDOW_MS = 120_000;

export function parsePossiblyNaiveUtc(lastUpdated: unknown) {
  if (typeof lastUpdated !== "string" || lastUpdated.length === 0) return null;
  const dateStr = lastUpdated.endsWith("Z") ? lastUpdated : `${lastUpdated}Z`;
  const ts = new Date(dateStr).getTime();
  if (!Number.isFinite(ts)) return null;
  return ts;
}

export function isOfflineFromLastUpdated(lastUpdated: unknown, nowMs: number) {
  const ts = parsePossiblyNaiveUtc(lastUpdated);
  if (ts === null) return true;
  return nowMs - ts > ONLINE_WINDOW_MS;
}

