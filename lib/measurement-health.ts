export function hasFreshExternalEvents(lastEvent: string | null, now = Date.now()): boolean {
  if (!lastEvent) return false;
  const time = Date.parse(lastEvent);
  return Number.isFinite(time) && time <= now + 60_000 && now - time <= 48 * 60 * 60 * 1000;
}
