import type { ButtonHTMLAttributes } from "react";

import { cx } from "@/shared/lib/format";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-on-brand border-brand hover:opacity-90",
  secondary: "bg-transparent text-ink border-ink hover:bg-mint",
  ghost: "bg-transparent text-ink border-transparent hover:bg-mint",
  danger: "bg-transparent text-danger border-danger hover:bg-mint",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 px-5 py-2 font-semibold transition",
        "disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
