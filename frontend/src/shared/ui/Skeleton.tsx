import { cx } from "@/shared/lib/format";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cx("skeleton rounded-xl", className)} />;
}
