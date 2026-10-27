import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { cx } from "@/shared/lib/format";

export function Loading({ label = "Cargando" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-8 text-muted">
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-brand"
      />
      <span>{label}…</span>
    </div>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-2xl border-2 border-danger bg-surface px-4 py-3 font-semibold text-danger"
    >
      {message}
    </p>
  );
}

interface EmptyStateProps {
  title: string;
  icon?: LucideIcon;
  children?: ReactNode;
}

export function EmptyState({ title, icon: Icon, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-card bg-mint px-6 py-7">
      {Icon && (
        <span
          aria-hidden="true"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface text-brand"
        >
          <Icon size={24} />
        </span>
      )}
      <p className="font-display text-xl font-semibold">{title}</p>
      {children && <div className="max-w-prose text-muted">{children}</div>}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, eyebrow, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1.5">
        {eyebrow && (
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand">{eyebrow}</p>
        )}
        <h1 className="text-4xl sm:text-5xl">{title}</h1>
        {description && <p className="max-w-prose text-lg text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
}

interface CardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, action, children, className }: CardProps) {
  return (
    <section
      className={cx(
        "flex min-w-0 flex-col gap-4 rounded-card border border-line bg-surface p-5 shadow-card sm:p-6",
        className,
      )}
    >
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="text-2xl">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

type BadgeTone = "neutral" | "brand" | "sun" | "danger";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-mint text-ink",
  brand: "bg-brand text-on-brand",
  sun: "bg-sun text-[#11302F]",
  danger: "border-danger bg-surface text-danger",
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border-2 border-transparent px-3 py-0.5 text-sm font-bold",
        BADGE_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

interface StatTileProps {
  to: string;
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "default" | "brand";
  className?: string;
}

export function StatTile({
  to,
  icon: Icon,
  label,
  value,
  tone = "default",
  className,
}: StatTileProps) {
  return (
    <Link
      to={to}
      className={cx(
        "group flex min-w-0 flex-col gap-2 rounded-card border border-line bg-surface p-4 shadow-card transition-shadow hover:shadow-pop sm:gap-3 sm:p-5",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-mint text-brand"
      >
        <Icon size={22} />
      </span>
      <span className="text-muted">{label}</span>
      <span
        className={cx(
          "font-display text-2xl font-semibold tabular-nums sm:text-4xl",
          tone === "brand" && "text-brand",
        )}
      >
        {value}
      </span>
    </Link>
  );
}
