import type { ButtonHTMLAttributes } from "react";

import { cx } from "@/shared/lib/format";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "border-brand bg-brand text-on-brand shadow-sm hover:opacity-90",
  secondary: "border-transparent bg-mint text-ink hover:bg-line",
  ghost: "border-transparent bg-transparent text-ink hover:bg-mint",
  danger: "border-danger bg-surface text-danger hover:bg-mint",
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
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 px-5 py-2 font-semibold transition-opacity",
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

export const linkButtonClass = (variant: Variant = "primary") =>
  cx(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 px-5 py-2 font-semibold transition-opacity",
    VARIANTS[variant],
  );
