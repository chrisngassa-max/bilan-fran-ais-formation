import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  variant?: "default" | "primary" | "secondary" | "success" | "warning";
  className?: string;
}

const variants = {
  default: "bg-surface-container text-on-surface-variant",
  primary: "bg-primary-container/20 text-primary",
  secondary: "bg-secondary-container text-on-secondary-container",
  success: "bg-eval-success/10 text-eval-success",
  warning: "bg-eval-orange-soft text-eval-orange",
};

export function Badge({ children, variant = "default", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
