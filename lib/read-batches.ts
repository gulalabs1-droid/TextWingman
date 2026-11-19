type QueryResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

/** Read past the database API's per-response row cap without exceeding our own limit. */
export async function readBatches<T>(
  makeQuery: () => { range: (from: number, to: number) => PromiseLike<QueryResult<T>> },
  maxRows: number,
  batchSize = 1000,
): Promise<{ data: T[]; error: { message: string } | null; truncated: boolean }> {
  const rows: T[] = [];
  while (rows.length < maxRows) {
    const requested = Math.min(batchSize, maxRows - rows.length);
    const { data, error } = await makeQuery().range(rows.length, rows.length + requested - 1);
    if (error) return { data: rows, error, truncated: false };
    const batch = data || [];
    rows.push(...batch);
    if (batch.length < requested) return { data: rows, error: null, truncated: false };
  }
  return { data: rows, error: null, truncated: true };
}
