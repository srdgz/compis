import { parseDay, todayIso } from "./format";

export type DueState = "overdue" | "today" | "tomorrow" | "later";

export function dueState(dateIso: string, today: string = todayIso()): DueState {
  const days = Math.round(
    (parseDay(dateIso).getTime() - parseDay(today).getTime()) / (24 * 60 * 60 * 1000),
  );
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return "later";
}

export const DUE_LABEL: Record<DueState, string> = {
  overdue: "Vencida",
  today: "Hoy",
  tomorrow: "Mañana",
  later: "",
};
