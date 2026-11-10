interface BillLine {
  label: string;
  amount: number;
  /** Shows "Free" instead of ₹0. */
  freeWhenZero?: boolean;
}

/** Bill lines plus the total. Plain rows on a calm card. */
export function BillSummary({
  lines,
  total,
  totalLabel = "To pay",
}: {
  lines: BillLine[];
  total: number;
  totalLabel?: string;
}) {
  const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  return (
    <section aria-label="Bill" className="space-y-2 rounded-lg border border-border bg-surface p-4">
      {lines.map((l) => (
        <div key={l.label} className="flex items-center justify-between text-sm text-fg-muted">
          <span>{l.label}</span>
          <span className="text-fg tabular-nums">
            {l.freeWhenZero && l.amount === 0 ? "Free" : rupees(l.amount)}
          </span>
        </div>
      ))}
      <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold text-fg">
        <span>{totalLabel}</span>
        <span className="tabular-nums">{rupees(total)}</span>
      </div>
    </section>
  );
}
