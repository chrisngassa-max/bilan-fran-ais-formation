import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import type { ReactNode } from "react";

type Variant = "info" | "warning" | "error";

interface Props {
  variant?: Variant;
  title?: string;
  children: ReactNode;
  className?: string;
}

const styles: Record<Variant, { wrap: string; icon: typeof Info }> = {
  info: { wrap: "border-outline-variant bg-surface-container text-on-surface-variant", icon: Info },
  warning: { wrap: "border-amber-300 bg-amber-50 text-amber-900", icon: AlertTriangle },
  error: { wrap: "border-error/30 bg-error-container/20 text-error", icon: AlertCircle },
};

export function Alert({ variant = "info", title, children, className }: Props) {
  const { wrap, icon: Icon } = styles[variant];
  return (
    <div className={cn("flex gap-4 rounded-xl border p-4 text-sm", wrap, className)} role="alert">
      <Icon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden />
      <div>
        {title && <p className="font-bold mb-1">{title}</p>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
