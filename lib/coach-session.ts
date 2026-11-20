// Saving and restoring Coach chats. A saved chat has to bring back everything
// Coach reasons from, not just the visible text: the conversation it read from
// screenshots and the latest Deep Analysis. Restoring replaces all of it, so
// nothing from the previously open chat carries over into the new one.

type Draft = { shorter?: string; spicier?: string; softer?: string } | null;

type Analysis = {
  mode?: string;
  winner?: { text?: string } | null;
  strategy?: { momentum: string; balance: string; move?: object | null } | null;
};

export type SavedSessionMessage<O extends Analysis = Analysis> = {
  role?: string;
  content?: string;
  text?: string;
  draft?: Draft;
  orchestration?: O | null;
  thread?: string;
};

export type RestoredCoachMessage<O extends Analysis = Analysis> = {
  role: 'user' | 'assistant';
  content: string;
  draft?: Draft;
  orchestration?: O | null;
  threadText?: string;
};

export type RestoredCoachSession<O extends Analysis = Analysis> = {
  history: RestoredCoachMessage<O>[];
  /** The conversation Coach should reason about; empty when there is none. */
  threadText: string;
  /** The latest read, for the side panel; null when the chat has none. */
  read: NonNullable<O['strategy']> | null;
};

export function restoreCoachSession<O extends Analysis>(
  type: string,
  saved: unknown,
): RestoredCoachSession<O> {
  const messages = (Array.isArray(saved) ? saved : []).filter(
    (m): m is SavedSessionMessage<O> => Boolean(m) && typeof m === 'object',
  );

  if (type !== 'coach') {
    // Reply threads are the conversation itself: show it, and give Coach the full text.
    const history: RestoredCoachMessage<O>[] = messages.map(m => ({
      role: m.role === 'them' ? 'user' : 'assistant',
      content: m.text || m.content || '',
    }));
    const threadText = messages
      .filter(m => (m.role === 'them' || m.role === 'you') && (m.text || m.content))
      .map(m => `${m.role === 'you' ? 'You' : 'Them'}: ${m.text || m.content}`)
      .join('\n');
    return { history, threadText, read: null };
  }

  const history: RestoredCoachMessage<O>[] = messages.map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content || '',
    draft: m.draft || null,
    orchestration: m.orchestration?.mode === 'orchestrate' ? m.orchestration : null,
    threadText: typeof m.thread === 'string' && m.thread ? m.thread : undefined,
  }));
  const latestFirst = [...history].reverse();
  const threadText = latestFirst.find(m => m.threadText)?.threadText || '';
  const read = latestFirst.find(m => m.orchestration?.strategy?.move)?.orchestration?.strategy ?? null;
  return { history, threadText, read: read as RestoredCoachSession<O>['read'] };
}

/** What gets stored for each Coach message. */
export function serializeCoachMessage<O extends Analysis>(m: RestoredCoachMessage<O> & { images?: string[] }) {
  return {
    role: m.role,
    content: m.content || (m.images?.length ? '📷 Screenshot' : ''),
    draft: m.draft || null,
    ...(m.orchestration ? { orchestration: m.orchestration } : {}),
    ...(m.threadText ? { thread: m.threadText } : {}),
  };
}

type PendingReply = { tone?: unknown; text?: unknown };
type PendingThread = {
  thread?: { role?: unknown; text?: unknown }[];
  replies?: PendingReply[];
  lastGeneratedMessage?: unknown;
};

/** How a message someone received is put to Coach when they arrive with it. */
export function receivedMessagePrompt(message: string): string {
  return `They sent me: "${message.trim()}"\nWhat should I reply?`;
}

/**
 * Turns the homepage composer's handoff (their message plus the replies it
 * already wrote) into a Coach chat, so people land in the same place as
 * everyone else and can keep going from there.
 */
export function coachSessionFromPending(pending: PendingThread): { history: RestoredCoachMessage[]; threadText: string } | null {
  const lines = (Array.isArray(pending.thread) ? pending.thread : [])
    .filter(m => m && typeof m.text === 'string' && m.text.trim())
    .map(m => `${m.role === 'you' ? 'You' : 'Them'}: ${(m.text as string).trim()}`);
  const last = typeof pending.lastGeneratedMessage === 'string' && pending.lastGeneratedMessage.trim()
    ? pending.lastGeneratedMessage.trim()
    : [...(Array.isArray(pending.thread) ? pending.thread : [])].reverse()
      .find(m => m && m.role !== 'you' && typeof m.text === 'string' && m.text.trim())?.text as string | undefined;
  if (!last) return null;

  const draft: Record<'shorter' | 'spicier' | 'softer', string | undefined> = { shorter: undefined, spicier: undefined, softer: undefined };
  for (const reply of Array.isArray(pending.replies) ? pending.replies : []) {
    if ((reply.tone === 'shorter' || reply.tone === 'spicier' || reply.tone === 'softer') && typeof reply.text === 'string' && reply.text.trim()) {
      draft[reply.tone] ??= reply.text.trim();
    }
  }
  const hasDraft = Boolean(draft.shorter || draft.spicier || draft.softer);
  const history: RestoredCoachMessage[] = [{ role: 'user', content: receivedMessagePrompt(last) }];
  if (hasDraft) history.push({ role: 'assistant', content: 'Here are the replies from before. Pick one, or tell me what to change.', draft });
  return { history, threadText: lines.length ? lines.join('\n') : `Them: ${last}` };
}
