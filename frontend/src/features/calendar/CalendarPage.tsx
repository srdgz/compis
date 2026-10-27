import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { useHomeContext } from "@/features/homes/context";
import { errorMessage } from "@/shared/api/http";
import { parseDay } from "@/shared/lib/format";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { Button } from "@/shared/ui/Button";
import { Badge, EmptyState, ErrorNotice, Loading, PageHeader } from "@/shared/ui/Feedback";

import type { CalendarEvent } from "./api";
import { useCalendar } from "./hooks";

export function groupByDay(events: CalendarEvent[]): Array<[string, CalendarEvent[]]> {
  const groups = new Map<string, CalendarEvent[]>();
  for (const event of [...events].sort((a, b) => a.start.localeCompare(b.start))) {
    const day = event.start.slice(0, 10);
    groups.set(day, [...(groups.get(day) ?? []), event]);
  }
  return [...groups.entries()];
}

function DayChip({ day }: { day: string }) {
  const date = parseDay(day);
  return (
    <span
      aria-hidden="true"
      className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-mint"
    >
      <span className="font-display text-2xl font-semibold leading-none">{date.getDate()}</span>
      <span className="text-xs font-bold uppercase text-muted">
        {new Intl.DateTimeFormat("es-ES", { month: "short" }).format(date).replace(".", "")}
      </span>
    </span>
  );
}

export function CalendarPage() {
  useDocumentTitle("Calendario");
  const { roomie } = useHomeContext();
  const events = useCalendar(roomie.id);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const monthKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(
    cursor,
  );
  const inMonth = (events.data ?? []).filter((event) => event.start.startsWith(monthKey));
  const groups = groupByDay(inMonth);

  function shift(months: number) {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + months, 1));
  }

  return (
    <>
      <PageHeader
        eyebrow="Agenda"
        title="Calendario"
        description="Tus tareas y los vencimientos de tus deudas, día a día."
      />

      <div className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface p-3 shadow-card">
        <Button variant="secondary" onClick={() => shift(-1)} aria-label="Mes anterior">
          <ChevronLeft aria-hidden="true" />
        </Button>
        <h2 className="text-center text-2xl first-letter:uppercase" aria-live="polite">
          {monthLabel}
        </h2>
        <Button variant="secondary" onClick={() => shift(1)} aria-label="Mes siguiente">
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>

      {events.isPending && <Loading />}
      {events.error && <ErrorNotice message={errorMessage(events.error)} />}
      {events.data && groups.length === 0 && (
        <EmptyState title="Nada en este mes" icon={CalendarDays}>
          No tienes tareas ni deudas con fecha en {monthLabel}.
        </EmptyState>
      )}

      <div className="flex flex-col gap-4">
        {groups.map(([day, dayEvents]) => (
          <section
            key={day}
            aria-label={new Intl.DateTimeFormat("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(parseDay(day))}
            className="flex gap-4 rounded-card border border-line bg-surface p-4 shadow-card"
          >
            <DayChip day={day} />
            <ul className="flex min-w-0 flex-1 flex-col gap-2">
              {dayEvents.map((event) => (
                <li
                  key={`${event.type}-${event.id}`}
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <span className="min-w-0 break-words font-semibold">{event.title}</span>
                  <Badge tone={event.type === "task" ? "neutral" : "sun"}>
                    {event.type === "task" ? "Tarea" : "Deuda"}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
