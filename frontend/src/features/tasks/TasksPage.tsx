import { useState } from "react";
import type { FormEvent } from "react";

import { useHomeContext } from "@/features/homes/context";
import { fullName } from "@/features/roomies/api";
import type { Roomie } from "@/features/roomies/api";
import { useHomeRoomies } from "@/features/roomies/hooks";
import { errorMessage } from "@/shared/api/http";
import { formatDay, todayIso } from "@/shared/lib/format";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog, Dialog } from "@/shared/ui/Dialog";
import { Checkbox, SelectField, TextField } from "@/shared/ui/Field";
import { Badge, EmptyState, ErrorNotice, Loading, PageHeader } from "@/shared/ui/Feedback";
import { useToast } from "@/shared/ui/Toast";

import type { Task } from "./api";
import {
  useCompleteTask,
  useCreateTask,
  useDeleteTask,
  useHomeTasks,
  useRescheduleTask,
} from "./hooks";

type Filter = "pending" | "done" | "all";

function NewTaskDialog({
  open,
  onClose,
  homeId,
  roomies,
  currentId,
}: {
  open: boolean;
  onClose: () => void;
  homeId: number;
  roomies: Roomie[];
  currentId: number;
}) {
  const toast = useToast();
  const create = useCreateTask(homeId);
  const [name, setName] = useState("");
  const [assignee, setAssignee] = useState(String(currentId));
  const [date, setDate] = useState(todayIso());
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Escribe qué hay que hacer.");
      return;
    }
    create.mutate(
      { roomie_id: Number(assignee), name: name.trim(), date_assigned: date },
      {
        onSuccess: () => {
          toast.success("Tarea creada.");
          setName("");
          setError(null);
          onClose();
        },
        onError: (caught) => setError(errorMessage(caught)),
      },
    );
  }

  return (
    <Dialog open={open} onClose={onClose} title="Nueva tarea">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && <ErrorNotice message={error} />}
        <TextField
          label="Qué hay que hacer"
          required
          maxLength={80}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <SelectField
          label="Quién lo hace"
          value={assignee}
          onChange={(event) => setAssignee(event.target.value)}
        >
          {roomies.map((roomie) => (
            <option key={roomie.id} value={roomie.id}>
              {fullName(roomie)}
              {roomie.id === currentId ? " (tú)" : ""}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Para cuándo"
          type="date"
          required
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={create.isPending}>
            Crear tarea
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function RescheduleDialog({
  task,
  homeId,
  onClose,
}: {
  task: Task | null;
  homeId: number;
  onClose: () => void;
}) {
  const toast = useToast();
  const reschedule = useRescheduleTask(homeId);
  const [date, setDate] = useState(task?.date_assigned ?? todayIso());

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!task) return;
    reschedule.mutate(
      { id: task.id, date },
      {
        onSuccess: () => {
          toast.success("Fecha actualizada.");
          onClose();
        },
        onError: (caught) => toast.error(errorMessage(caught)),
      },
    );
  }

  return (
    <Dialog open={task !== null} onClose={onClose} title="Cambiar la fecha">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-muted">{task?.name}</p>
        <TextField
          label="Nueva fecha"
          type="date"
          required
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={reschedule.isPending}>
            Guardar fecha
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function TasksPage() {
  useDocumentTitle("Tareas");
  const { roomie, homeId } = useHomeContext();
  const toast = useToast();
  const tasks = useHomeTasks(homeId);
  const roomies = useHomeRoomies(homeId);
  const complete = useCompleteTask(homeId);
  const remove = useDeleteTask(homeId);
  const [filter, setFilter] = useState<Filter>("pending");
  const [onlyMine, setOnlyMine] = useState(false);
  const [creating, setCreating] = useState(false);
  const [rescheduling, setRescheduling] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);

  const visible = (tasks.data ?? []).filter((task) => {
    if (onlyMine && task.roomie_id !== roomie.id) return false;
    if (filter === "pending") return !task.date_done;
    if (filter === "done") return Boolean(task.date_done);
    return true;
  });

  return (
    <>
      <PageHeader
        title="Tareas"
        description="Quién hace qué y para cuándo."
        actions={<Button onClick={() => setCreating(true)}>Nueva tarea</Button>}
      />

      <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
        <div className="w-56">
          <SelectField
            label="Mostrar"
            value={filter}
            onChange={(event) => setFilter(event.target.value as Filter)}
          >
            <option value="pending">Pendientes</option>
            <option value="done">Hechas</option>
            <option value="all">Todas</option>
          </SelectField>
        </div>
        <Checkbox
          label="Solo las mías"
          checked={onlyMine}
          onChange={(event) => setOnlyMine(event.target.checked)}
        />
      </div>

      {tasks.isPending && <Loading />}
      {tasks.error && <ErrorNotice message={errorMessage(tasks.error)} />}
      {tasks.data && visible.length === 0 && (
        <EmptyState title="No hay tareas que mostrar">
          Cambia el filtro o crea una tarea nueva.
        </EmptyState>
      )}

      <ul className="flex flex-col gap-3">
        {visible.map((task) => {
          const done = Boolean(task.date_done);
          return (
            <li
              key={task.id}
              className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <p className={done ? "font-semibold line-through" : "font-semibold"}>{task.name}</p>
                <p className="text-muted">
                  {task.roomie_id === roomie.id ? "Tú" : (task.roomie?.first_name ?? "Un compi")} ·{" "}
                  {done && task.date_done
                    ? `Hecha el ${formatDay(task.date_done)}`
                    : `Para el ${formatDay(task.date_assigned)}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {done ? (
                  <Badge tone="brand">Hecha</Badge>
                ) : (
                  <>
                    <Button
                      loading={complete.isPending && complete.variables === task.id}
                      onClick={() =>
                        complete.mutate(task.id, {
                          onSuccess: () => toast.success(`«${task.name}» marcada como hecha.`),
                          onError: (caught) => toast.error(errorMessage(caught)),
                        })
                      }
                    >
                      Marcar hecha
                    </Button>
                    <Button variant="secondary" onClick={() => setRescheduling(task)}>
                      Cambiar fecha
                    </Button>
                  </>
                )}
                <Button variant="danger" onClick={() => setDeleting(task)}>
                  Eliminar
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <NewTaskDialog
        open={creating}
        onClose={() => setCreating(false)}
        homeId={homeId}
        roomies={roomies.data ?? [roomie]}
        currentId={roomie.id}
      />
      <RescheduleDialog
        key={rescheduling?.id ?? "none"}
        task={rescheduling}
        homeId={homeId}
        onClose={() => setRescheduling(null)}
      />
      <ConfirmDialog
        open={deleting !== null}
        title="Eliminar tarea"
        message={`¿Seguro que quieres eliminar «${deleting?.name ?? ""}»? No se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, {
            onSuccess: () => {
              toast.success("Tarea eliminada.");
              setDeleting(null);
            },
            onError: (caught) => toast.error(errorMessage(caught)),
          });
        }}
      />
    </>
  );
}
