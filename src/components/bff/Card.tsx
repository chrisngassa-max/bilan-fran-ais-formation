import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className, children, ...rest }: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-outline-variant bg-surface-bright p-6 shadow-sm",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
