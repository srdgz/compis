import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { useHomeContext } from "@/features/homes/context";
import { errorMessage } from "@/shared/api/http";
import { formatLongDay } from "@/shared/lib/format";
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
        title="Calendario"
        description="Tus tareas y los vencimientos de tus deudas, día a día."
      />

      <div className="flex items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => shift(-1)} aria-label="Mes anterior">
          <ChevronLeft aria-hidden="true" />
        </Button>
        <h2 className="text-2xl capitalize" aria-live="polite">
          {monthLabel}
        </h2>
        <Button variant="secondary" onClick={() => shift(1)} aria-label="Mes siguiente">
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>

      {events.isPending && <Loading />}
      {events.error && <ErrorNotice message={errorMessage(events.error)} />}
      {events.data && groups.length === 0 && (
        <EmptyState title="Nada en este mes">
          No tienes tareas ni deudas con fecha en {monthLabel}.
        </EmptyState>
      )}

      <div className="flex flex-col gap-6">
        {groups.map(([day, dayEvents]) => (
          <section key={day} aria-labelledby={`day-${day}`} className="flex flex-col gap-2">
            <h3 id={`day-${day}`} className="text-lg capitalize">
              {formatLongDay(day)}
            </h3>
            <ul className="flex flex-col gap-2">
              {dayEvents.map((event) => (
                <li
                  key={`${event.type}-${event.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3"
                >
                  <span>{event.title}</span>
                  <Badge tone={event.type === "task" ? "neutral" : "brand"}>
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
