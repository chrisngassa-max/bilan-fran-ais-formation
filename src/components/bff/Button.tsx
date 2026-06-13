import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "cta" | "danger" | "whatsapp";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-container",
  secondary: "bg-secondary text-on-secondary hover:opacity-90",
  outline:
    "bg-surface-bright text-on-surface border border-outline-variant hover:bg-surface-container",
  ghost: "bg-transparent text-on-surface hover:bg-surface-container",
  cta: "bg-eval-orange text-white hover:opacity-95 active:scale-95 shadow-md",
  danger: "bg-error text-white hover:opacity-90",
  whatsapp: "bg-whatsapp text-white hover:bg-whatsapp-hover shadow-md",
};

const sizes: Record<Size, string> = {
  md: "min-h-12 px-5 text-base",
  lg: "min-h-14 px-6 text-base",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "lg",
  className,
  asChild = false,
  children,
  ...rest
}: Props) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </Comp>
  );
}
