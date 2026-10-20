export function DemoNotice() {
  return (
    <div
      role="note"
      aria-live="polite"
      className="border-b border-amber-300/70 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-950"
    >
      Demo only. Fictional data. Changes are not saved. No authentication.
    </div>
  );
}