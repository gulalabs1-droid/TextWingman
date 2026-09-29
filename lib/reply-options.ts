export function parseReplyOptions(value: unknown): Array<{ tone: 'shorter' | 'spicier' | 'softer'; text: string }> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid reply options');
  }
  const object = value as Record<string, unknown>;
  return (['shorter', 'spicier', 'softer'] as const).map(tone => {
    const text = object[tone];
    if (typeof text !== 'string' || !text.trim()) throw new Error(`Missing ${tone} reply`);
    return { tone, text: text.trim() };
  });
}
