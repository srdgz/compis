import { cx } from "@/shared/lib/format";

const TONES = [1, 2, 3, 4, 5, 6] as const;

export function toneFor(name: string): (typeof TONES)[number] {
  let hash = 7;
  for (const char of name.trim().toLowerCase()) hash = (hash * 31 + char.charCodeAt(0)) % 9973;
  return TONES[hash % TONES.length] ?? 1;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + second).toUpperCase();
}

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
} as const;

interface AvatarProps {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold",
        `avatar-tone-${toneFor(name)}`,
        SIZES[size],
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

export function AvatarStack({ names, max = 4 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <span aria-hidden="true" className="flex items-center">
      {shown.map((name, index) => (
        <Avatar
          key={`${name}-${index}`}
          name={name}
          size="md"
          className={cx("ring-2 ring-surface", index > 0 && "-ml-3")}
        />
      ))}
      {extra > 0 && (
        <span className="-ml-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-mint text-sm font-bold ring-2 ring-surface">
          +{extra}
        </span>
      )}
    </span>
  );
}
