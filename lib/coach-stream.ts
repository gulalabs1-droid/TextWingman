const DRAFT_MARKER = 'DRAFT:';

export type CoachDraft = { shorter?: string; spicier?: string; softer?: string };

export type CoachStreamEvent =
  | { t: 'delta'; v: string }
  | { t: 'done'; reply: string; draft: CoachDraft | null; verified: boolean }
  | { t: 'error' };

// The part of a partially streamed reply that is safe to show: the machine-readable
// DRAFT block is never shown, and a trailing partial "DRAF" is held back until we know what it is.
export function visibleCoachText(raw: string): string {
  const markerAt = raw.indexOf(DRAFT_MARKER);
  if (markerAt !== -1) return raw.slice(0, markerAt).trimEnd();
  for (let length = Math.min(DRAFT_MARKER.length - 1, raw.length); length > 0; length--) {
    if (raw.endsWith(DRAFT_MARKER.slice(0, length))) return raw.slice(0, raw.length - length).trimEnd();
  }
  return raw.trimEnd();
}

export function parseCoachReply(raw: string): { reply: string; draft: CoachDraft | null } {
  const match = raw.match(/DRAFT:\s*(\{[\s\S]*?\})\s*$/);
  if (!match) return { reply: raw, draft: null };
  try {
    return { reply: raw.slice(0, match.index).trim(), draft: JSON.parse(match[1]) as CoachDraft };
  } catch {
    return { reply: raw, draft: null };
  }
}

// Reads newline-delimited JSON events from a streamed response body.
export async function readCoachStream(body: ReadableStream<Uint8Array>, onEvent: (event: CoachStreamEvent) => void) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split('\n');
    buffer = done ? '' : lines.pop() || '';
    for (const line of lines) {
      if (line.trim()) onEvent(JSON.parse(line) as CoachStreamEvent);
    }
    if (done) return;
  }
}
