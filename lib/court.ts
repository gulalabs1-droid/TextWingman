export const COURT_POLL_ID = 'lol-v1';

export const COURT_CHOICES = [
  { id: 'A', text: '“what’s funny?”' },
  { id: 'B', text: '“you got me laughing too”' },
  { id: 'C', text: 'Nothing. Let it breathe.' },
] as const;

export type CourtChoice = (typeof COURT_CHOICES)[number]['id'];
export type CourtResults = {
  counts: Record<CourtChoice, number>;
  total: number;
  selected: CourtChoice | null;
};

export function isCourtChoice(value: unknown): value is CourtChoice {
  return typeof value === 'string' && COURT_CHOICES.some(choice => choice.id === value);
}

export function votePercent(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}
