const euro = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export function formatEuro(amount: number): string {
  return euro.format(amount);
}

export function parseDay(iso: string): Date {
  const [year = 0, month = 1, day = 1] = iso.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long" }).format(parseDay(iso));
}

export function formatLongDay(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(parseDay(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );
}

export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
