import { Info } from "lucide-react";
import type { ReactNode } from "react";

export function Disclaimer({ children }: { children: ReactNode }) {
  return (
    <aside
      role="note"
      className="flex items-start gap-3 rounded-lg border border-outline-variant bg-surface-container p-4 text-on-surface-variant body-md"
    >
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-secondary" aria-hidden="true" />
      <p>{children}</p>
    </aside>
  );
}
