import type { ReactNode } from "react";

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
      className="rounded-xl border-2 border-danger px-4 py-3 font-semibold text-danger"
    >
      {message}
    </p>
  );
}

interface EmptyStateProps {
  title: string;
  children?: ReactNode;
}

export function EmptyState({ title, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col gap-2 rounded-card bg-mint px-6 py-8">
      <p className="font-display text-lg font-bold">{title}</p>
      {children && <div className="text-muted">{children}</div>}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl sm:text-4xl">{title}</h1>
        {description && <p className="max-w-prose text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
}

export function Card({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "flex flex-col gap-4 rounded-card border border-line bg-surface p-5",
        className,
      )}
    >
      {title && <h2 className="text-xl">{title}</h2>}
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "brand";
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border-2 px-3 py-0.5 text-sm font-semibold",
        tone === "brand" ? "border-brand bg-brand text-on-brand" : "border-ink text-ink",
      )}
    >
      {children}
    </span>
  );
}
