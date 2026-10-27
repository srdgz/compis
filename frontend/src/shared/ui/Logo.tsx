export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path
        d="M8 30 L32 10 L56 30"
        fill="none"
        stroke="rgb(var(--ink))"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="26" cy="40" r="14" fill="rgb(var(--brand))" />
      <circle cx="40" cy="40" r="14" fill="rgb(var(--sun))" />
      <path d="M33 27.88 A14 14 0 0 1 33 52.12 A14 14 0 0 1 33 27.88 Z" fill="rgb(var(--ink))" />
    </svg>
  );
}

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      <span className="font-display text-2xl font-semibold tracking-tight">compis</span>
    </span>
  );
}
