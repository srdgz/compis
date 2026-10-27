import { useHomeContext } from "@/features/homes/context";
import { errorMessage } from "@/shared/api/http";
import { formatDateTime } from "@/shared/lib/format";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { Badge, EmptyState, ErrorNotice, Loading, PageHeader } from "@/shared/ui/Feedback";

import { useActivity } from "./hooks";

export function ActivityPage() {
  useDocumentTitle("Novedades");
  const { homeId } = useHomeContext();
  const activity = useActivity(homeId);

  return (
    <>
      <PageHeader title="Novedades" description="Lo último que ha pasado en la casa." />
      {activity.isPending && <Loading />}
      {activity.error && <ErrorNotice message={errorMessage(activity.error)} />}
      {activity.data && activity.data.length === 0 && (
        <EmptyState title="Todo tranquilo">Cuando alguien haga algo, lo verás aquí.</EmptyState>
      )}
      <ol className="flex flex-col gap-3">
        {(activity.data ?? []).map((entry) => (
          <li
            key={entry.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface p-4"
          >
            <div>
              <p className="font-semibold">{entry.text}</p>
              <p className="text-muted">
                <time dateTime={entry.date}>{formatDateTime(entry.date)}</time>
              </p>
            </div>
            <Badge tone={entry.status === "Hecho" ? "brand" : "neutral"}>{entry.status}</Badge>
          </li>
        ))}
      </ol>
    </>
  );
}
