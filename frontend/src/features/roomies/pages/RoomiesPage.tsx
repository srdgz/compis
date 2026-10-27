import { UserMinus, UserPlus } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";

import { useHomeContext } from "@/features/homes/context";
import { useAddRoomie, useRemoveRoomie } from "@/features/homes/hooks";
import { errorMessage } from "@/shared/api/http";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/Dialog";
import { Badge, Card, ErrorNotice, Loading, PageHeader } from "@/shared/ui/Feedback";
import { TextField } from "@/shared/ui/Field";
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
      <PageHeader
        eyebrow="Hogar"
        title="Roomies"
        description="Las personas que vivís en la casa."
      />

      {roomies.isPending && <Loading />}
      {roomies.error && <ErrorNotice message={errorMessage(roomies.error)} />}

      <ul className="grid gap-4 sm:grid-cols-2">
        {(roomies.data ?? []).map((member) => (
          <li
            key={member.id}
            className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 shadow-card"
          >
            <div className="flex items-center gap-4">
              <Avatar name={member.first_name} src={member.avatar} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="break-words font-display text-xl font-semibold">
                  {fullName(member)}
                  {member.id === roomie.id ? " (tú)" : ""}
                </p>
                <p className="break-all text-sm text-muted">{member.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {member.admin && <Badge tone="brand">Administrador</Badge>}
              {member.paypal_username && <Badge>PayPal.Me</Badge>}
            </div>
            {roomie.admin && member.id !== roomie.id && (
              <Button variant="danger" onClick={() => setRemoving(member)}>
                <UserMinus aria-hidden="true" size={18} />
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
            <div>
              <Button type="submit" loading={add.isPending}>
                <UserPlus aria-hidden="true" size={18} />
                Añadir roomie
              </Button>
            </div>
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
