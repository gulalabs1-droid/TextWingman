type InvoiceEvidence = {
  amount_paid: number;
  subscription: string | { id: string } | null;
  status_transitions?: { paid_at: number | null } | null;
};

/** Only positive paid invoices are evidence of a customer paying for a subscription. */
export function paidSubscriptionIds(invoices: InvoiceEvidence[]): Set<string> {
  return new Set(invoices.filter(invoice => invoice.amount_paid > 0).map(invoice =>
    typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id,
  ).filter((id): id is string => Boolean(id)));
}

export function firstPaidDates(invoices: InvoiceEvidence[]): Map<string, string> {
  const result = new Map<string, string>();
  for (const invoice of invoices) {
    const id = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
    const paidAt = invoice.status_transitions?.paid_at;
    if (!id || invoice.amount_paid <= 0 || !paidAt) continue;
    const date = new Date(paidAt * 1000).toISOString();
    if (!result.has(id) || date < result.get(id)!) result.set(id, date);
  }
  return result;
}
