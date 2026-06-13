import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

const baseClass =
  "w-full h-12 px-4 rounded-xl border-2 border-outline-variant bg-surface-container text-on-surface font-semibold text-base transition-all outline-none focus:border-primary focus:bg-surface-bright focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-on-surface-variant/60";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function Input({ className, ...rest }: Props) {
  return <input className={cn(baseClass, className)} {...rest} />;
}
