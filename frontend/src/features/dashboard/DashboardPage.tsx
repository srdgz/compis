import { Link } from "react-router-dom";

import { useActivity } from "@/features/activity/hooks";
import { useDebts } from "@/features/finance/hooks";
import { useHomeContext } from "@/features/homes/context";
import { useHome } from "@/features/homes/hooks";
import { useShoppingItems, useShoppingList } from "@/features/shopping/hooks";
import { useHomeTasks } from "@/features/tasks/hooks";
import { formatDay, formatEuro } from "@/shared/lib/format";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { Card, EmptyState, ErrorNotice, Loading, PageHeader } from "@/shared/ui/Feedback";

function SeeAll({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="font-semibold text-brand underline">
      {label}
    </Link>
  );
}

export function DashboardPage() {
  useDocumentTitle("Inicio");
  const { roomie, homeId } = useHomeContext();
  const home = useHome(homeId);
  const tasks = useHomeTasks(homeId);
  const debts = useDebts(roomie.id);
  const list = useShoppingList(homeId);
  const items = useShoppingItems(list.data?.id);
  const activity = useActivity(homeId);

  const myPending = (tasks.data ?? []).filter((t) => t.roomie_id === roomie.id && !t.date_done);
  const owed = (debts.data ?? [])
    .filter((d) => d.roomie_paying_id === roomie.id)
    .reduce((sum, d) => sum + d.amount, 0);
  const owe = (debts.data ?? [])
    .filter((d) => d.roomie_debtor_id === roomie.id)
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <>
      <PageHeader
        title={`Hola, ${roomie.first_name}`}
        description={home.data ? `Así va ${home.data.name}.` : undefined}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Mis tareas pendientes">
          {tasks.isPending && <Loading />}
          {tasks.error && <ErrorNotice message="No se han podido cargar las tareas." />}
          {tasks.data && myPending.length === 0 && (
            <EmptyState title="Estás al día">No tienes tareas pendientes.</EmptyState>
          )}
          <ul className="flex flex-col gap-2">
            {myPending.slice(0, 5).map((task) => (
              <li key={task.id} className="flex justify-between gap-3">
                <span>{task.name}</span>
                <span className="shrink-0 text-muted">{formatDay(task.date_assigned)}</span>
              </li>
            ))}
          </ul>
          <SeeAll to="/tasks" label="Ver todas las tareas" />
        </Card>

        <Card title="Dinero">
          {debts.isPending && <Loading />}
          {debts.error && <ErrorNotice message="No se han podido cargar las deudas." />}
          {debts.data && (
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-muted">Debes</dt>
                <dd className="font-display text-3xl font-bold">{formatEuro(owe)}</dd>
              </div>
              <div>
                <dt className="text-muted">Te deben</dt>
                <dd className="font-display text-3xl font-bold text-brand">{formatEuro(owed)}</dd>
              </div>
            </dl>
          )}
          <SeeAll to="/expenses" label="Ver gastos y deudas" />
        </Card>

        <Card title="Lista de la compra">
          {items.isPending && <Loading />}
          {items.data && (
            <p>
              {items.data.length === 0
                ? "No falta nada por comprar."
                : `${items.data.length} ${items.data.length === 1 ? "elemento" : "elementos"} por comprar.`}
            </p>
          )}
          <SeeAll to="/shopping" label="Abrir la lista" />
        </Card>

        <Card title="Últimas novedades">
          {activity.isPending && <Loading />}
          {activity.data && activity.data.length === 0 && (
            <EmptyState title="Todo tranquilo">Aún no hay novedades.</EmptyState>
          )}
          <ul className="flex flex-col gap-2">
            {(activity.data ?? []).slice(0, 4).map((entry) => (
              <li key={entry.id}>{entry.text}</li>
            ))}
          </ul>
          <SeeAll to="/activity" label="Ver todas las novedades" />
        </Card>
      </div>
    </>
  );
}
