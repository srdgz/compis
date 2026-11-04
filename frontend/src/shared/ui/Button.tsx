import type { ButtonHTMLAttributes } from "react";

import { cx } from "@/shared/lib/format";

import { LoadingDots } from "./LoadingDots";

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
  loadingLabel?: string;
  iconOnly?: boolean;
}

export function Button({
  variant = "primary",
  loading = false,
  loadingLabel,
  iconOnly = false,
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
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 py-2 font-semibold transition-opacity",
        iconOnly ? "w-11 shrink-0 px-0" : "px-5",
        loading ? "cursor-progress" : "disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <>
          {!iconOnly && (loadingLabel ?? children)}
          <LoadingDots />
        </>
      ) : (
        children
      )}
    </button>
  );
}

export const linkButtonClass = (variant: Variant = "primary") =>
  cx(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 px-5 py-2 font-semibold transition-opacity",
    VARIANTS[variant],
  );
