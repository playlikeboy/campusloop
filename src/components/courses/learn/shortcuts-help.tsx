const KEYS: [string, string][] = [
  ["Space", "Play or pause"],
  ["Left / Right", "Back or forward 5 seconds"],
  ["N", "Next lecture"],
  ["P", "Previous lecture"],
  ["M", "Mark as done"],
  ["[", "Show or hide course content"],
  ["?", "Show or hide this list"],
];

/** Keyboard shortcut list shown under the player header on desktop. */
export function ShortcutsHelp() {
  return (
    <dl className="flex flex-wrap gap-x-5 gap-y-1.5 border-b border-border bg-surface-muted px-4 py-2.5 text-xs text-fg-muted">
      {KEYS.map(([k, v]) => (
        <div key={k} className="flex items-center gap-1.5">
          <dt>
            <kbd className="rounded-sm border border-border-strong bg-surface px-1.5 py-0.5 font-sans font-semibold text-fg">
              {k}
            </kbd>
          </dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
