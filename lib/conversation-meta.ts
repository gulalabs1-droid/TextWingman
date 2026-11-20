// Who a conversation is with, read from a screenshot: the contact's name from
// the chat header and a best guess at the relationship. Coach uses it to fill
// in "who is it" and to name the chat, so people don't have to.

export const RELATIONSHIPS = ['crush', 'new_match', 'friend', 'colleague', 'family', 'ex'] as const;
export type Relationship = typeof RELATIONSHIPS[number];

/** Keeps only a plausible display name: letters, digits, spaces and simple punctuation. */
export function cleanContactName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = value.normalize('NFKC').replace(/[^\p{L}\p{M}\p{N}'’ .-]/gu, ' ').replace(/\s+/g, ' ').trim();
  if (!name || name.length > 30) return null;
  if (/^(unknown|none|null|n\/a|them|you|me)$/i.test(name)) return null;
  // Phone numbers and similar identifiers are not names worth showing.
  if (/^[\d\s().+-]+$/.test(name)) return null;
  return name;
}

export function cleanRelationship(value: unknown, confidence?: unknown): Relationship | null {
  if (typeof value !== 'string') return null;
  if (confidence === 'low') return null;
  const normalized = value.toLowerCase().trim().replace(/[\s-]+/g, '_');
  const aliases: Record<string, Relationship> = { work: 'colleague', coworker: 'colleague', boss: 'colleague', dating: 'crush', match: 'new_match' };
  const relationship = (aliases[normalized] || normalized) as Relationship;
  return (RELATIONSHIPS as readonly string[]).includes(relationship) ? relationship : null;
}
