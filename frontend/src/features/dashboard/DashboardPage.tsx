import { ArrowRight, ListChecks, ShoppingBasket, TrendingDown, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

import { useActivity } from "@/features/activity/hooks";
import { useDebts } from "@/features/finance/hooks";
import { useHomeContext } from "@/features/homes/context";
import { useHome } from "@/features/homes/hooks";
import { useHomeRoomies } from "@/features/roomies/hooks";
import { useShoppingItems, useShoppingList } from "@/features/shopping/hooks";
import { useHomeTasks } from "@/features/tasks/hooks";
import { DUE_LABEL, dueState } from "@/shared/lib/due";
import {
  formatDateTime,
  formatDay,
  formatEuro,
  formatLongDay,
  todayIso,
} from "@/shared/lib/format";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { Avatar, AvatarStack } from "@/shared/ui/Avatar";
import {
  Badge,
  Card,
  EmptyState,
  ErrorNotice,
  Loading,
  PageHeader,
  StatTile,
} from "@/shared/ui/Feedback";

function SeeAll({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="inline-flex min-h-11 items-center gap-2 font-semibold text-brand">
      <span className="underline">{label}</span>
      <ArrowRight aria-hidden="true" size={18} />
    </Link>
  );
}

export function DashboardPage() {
  useDocumentTitle("Inicio");
  const { roomie, homeId } = useHomeContext();
  const home = useHome(homeId);
  const roomies = useHomeRoomies(homeId);
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
  const people = (roomies.data ?? []).map((r) => ({ name: r.first_name, avatar: r.avatar }));
  const names = people.map((p) => p.name);
  const avatarByName = new Map(people.map((p) => [p.name, p.avatar]));

  return (
    <>
      <PageHeader
        eyebrow={formatLongDay(todayIso())}
        title={`Hola, ${roomie.first_name}`}
        description={home.data ? `Así va ${home.data.name}.` : undefined}
        actions={
          names.length > 0 && (
            <div className="flex items-center gap-3">
              <AvatarStack people={people} />
              <span className="text-muted">
                {names.length} {names.length === 1 ? "persona" : "personas"} en casa
              </span>
            </div>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatTile
          to="/tasks"
          icon={ListChecks}
          label="Tareas pendientes"
          value={tasks.data ? String(myPending.length) : "–"}
        />
        <StatTile
          to="/expenses"
          icon={TrendingDown}
          label="Debes"
          value={debts.data ? formatEuro(owe) : "–"}
        />
        <StatTile
          to="/expenses"
          icon={TrendingUp}
          label="Te deben"
          value={debts.data ? formatEuro(owed) : "–"}
          tone="brand"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card title="Tus próximas tareas" action={<SeeAll to="/tasks" label="Ver todas" />}>
            {tasks.isPending && <Loading />}
            {tasks.error && <ErrorNotice message="No se han podido cargar las tareas." />}
            {tasks.data && myPending.length === 0 && (
              <EmptyState title="Estás al día" icon={ListChecks}>
                No tienes tareas pendientes. ¡Buen trabajo!
              </EmptyState>
            )}
            <ul className="flex flex-col gap-2">
              {myPending.slice(0, 5).map((task) => {
                const state = dueState(task.date_assigned);
                return (
                  <li
                    key={task.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-bg px-4 py-3"
                  >
                    <span className="font-semibold">{task.name}</span>
                    <span className="flex items-center gap-2">
                      {state !== "later" && (
                        <Badge tone={state === "overdue" ? "danger" : "sun"}>
                          {DUE_LABEL[state]}
                        </Badge>
                      )}
                      <span className="text-muted">{formatDay(task.date_assigned)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card
            title="Lista de la compra"
            action={<SeeAll to="/shopping" label="Abrir la lista" />}
          >
            {items.isPending && <Loading />}
            {items.data && items.data.length === 0 && (
              <EmptyState title="No falta nada" icon={ShoppingBasket}>
                Cuando alguien apunte algo, aparecerá aquí.
              </EmptyState>
            )}
            {items.data && items.data.length > 0 && (
              <>
                <p>
                  {items.data.length} {items.data.length === 1 ? "elemento" : "elementos"} por
                  comprar.
                </p>
                <ul className="flex flex-wrap gap-2">
                  {items.data.slice(0, 6).map((item) => (
                    <li key={item.id} className="rounded-full bg-mint px-4 py-1.5 font-semibold">
                      {item.name}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </div>

        <Card title="Novedades" action={<SeeAll to="/activity" label="Ver todas" />}>
          {activity.isPending && <Loading />}
          {activity.data && activity.data.length === 0 && (
            <EmptyState title="Todo tranquilo">Aún no hay novedades.</EmptyState>
          )}
          <ul className="flex flex-col gap-4">
            {(activity.data ?? []).slice(0, 5).map((entry) => (
              <li key={entry.id} className="flex items-start gap-3">
                <Avatar
                  name={entry.roomie_name}
                  src={avatarByName.get(entry.roomie_name)}
                  size="sm"
                />
                <div className="min-w-0">
                  <p>{entry.text}</p>
                  <p className="text-sm text-muted">{formatDateTime(entry.date)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
