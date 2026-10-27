import { useState } from "react";
import type { FormEvent } from "react";

import { useHomeContext } from "@/features/homes/context";
import { useAddRoomie, useRemoveRoomie } from "@/features/homes/hooks";
import { errorMessage } from "@/shared/api/http";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/Dialog";
import { TextField } from "@/shared/ui/Field";
import { Badge, Card, ErrorNotice, Loading, PageHeader } from "@/shared/ui/Feedback";
import { useToast } from "@/shared/ui/Toast";

import { fullName } from "../api";
import type { Roomie } from "../api";
import { useHomeRoomies } from "../hooks";

export function RoomiesPage() {
  useDocumentTitle("Roomies");
  const { roomie, homeId } = useHomeContext();
  const toast = useToast();
  const roomies = useHomeRoomies(homeId);
  const add = useAddRoomie(homeId);
  const remove = useRemoveRoomie(homeId);
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Roomie | null>(null);

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    add.mutate(email.trim(), {
      onSuccess: () => {
        toast.success("Roomie añadido a la vivienda.");
        setEmail("");
      },
      onError: (caught) => setFormError(errorMessage(caught)),
    });
  }

  return (
    <>
      <PageHeader title="Roomies" description="Las personas que vivís en la casa." />

      {roomies.isPending && <Loading />}
      {roomies.error && <ErrorNotice message={errorMessage(roomies.error)} />}

      <ul className="grid gap-4 sm:grid-cols-2">
        {(roomies.data ?? []).map((member) => (
          <li
            key={member.id}
            className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-display text-xl font-bold">
                {fullName(member)}
                {member.id === roomie.id ? " (tú)" : ""}
              </p>
              {member.admin && <Badge tone="brand">Administrador</Badge>}
            </div>
            <p className="break-all text-muted">{member.email}</p>
            {roomie.admin && member.id !== roomie.id && (
              <Button variant="danger" onClick={() => setRemoving(member)}>
                Quitar de la vivienda
              </Button>
            )}
          </li>
        ))}
      </ul>

      {roomie.admin && (
        <Card title="Añadir a alguien">
          <form onSubmit={handleAdd} className="flex flex-col gap-4" noValidate>
            {formError && <ErrorNotice message={formError} />}
            <TextField
              label="Correo electrónico del nuevo roomie"
              type="email"
              autoComplete="off"
              hint="Debe tener ya una cuenta en Compis y no pertenecer a otra vivienda."
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button type="submit" loading={add.isPending}>
              Añadir roomie
            </Button>
          </form>
        </Card>
      )}

      <ConfirmDialog
        open={removing !== null}
        title="Quitar de la vivienda"
        message={`¿Seguro que quieres quitar a ${removing ? fullName(removing) : ""} de la vivienda? No podrá hacerlo si tiene deudas pendientes.`}
        confirmLabel="Quitar"
        loading={remove.isPending}
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (!removing) return;
          remove.mutate(removing.id, {
            onSuccess: () => {
              toast.success("Roomie quitado de la vivienda.");
              setRemoving(null);
            },
            onError: (caught) => {
              toast.error(errorMessage(caught));
              setRemoving(null);
            },
          });
        }}
      />
    </>
  );
}
