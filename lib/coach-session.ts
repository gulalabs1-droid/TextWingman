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
