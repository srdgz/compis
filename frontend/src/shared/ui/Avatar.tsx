import { useState } from "react";

import { avatarSrc } from "@/shared/api/cloudinary";
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
  sm: { box: "h-8 w-8 text-xs", pixels: 32 },
  md: { box: "h-10 w-10 text-sm", pixels: 40 },
  lg: { box: "h-14 w-14 text-lg", pixels: 56 },
  xl: { box: "h-20 w-20 text-2xl", pixels: 80 },
  "2xl": { box: "h-28 w-28 text-4xl", pixels: 112 },
} as const;

export interface Person {
  name: string;
  avatar?: string | null;
}

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const { box, pixels } = SIZES[size];
  const resolved = avatarSrc(src, pixels);
  const showImage = resolved !== null && failedSrc !== resolved;

  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-bold",
        !showImage && `avatar-tone-${toneFor(name)}`,
        box,
        className,
      )}
    >
      {showImage ? (
        <img
          src={resolved}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setFailedSrc(resolved)}
          className="h-full w-full object-cover"
        />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}

export function AvatarStack({ people, max = 4 }: { people: Person[]; max?: number }) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <span aria-hidden="true" className="flex items-center">
      {shown.map((person, index) => (
        <Avatar
          key={`${person.name}-${index}`}
          name={person.name}
          src={person.avatar}
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
