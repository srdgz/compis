import { useState } from "react";
import type { FormEvent } from "react";

import { useAuth } from "@/features/auth/AuthProvider";
import { isValidPaypalUsername } from "@/features/finance/paypal";
import type { Roomie } from "@/features/roomies/api";
import { useCurrentRoomie, useDeactivateAccount, useUpdateProfile } from "@/features/roomies/hooks";
import { errorMessage } from "@/shared/api/http";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/Dialog";
import { TextField } from "@/shared/ui/Field";
import { Card, ErrorNotice, Loading, PageHeader } from "@/shared/ui/Feedback";
import { useToast } from "@/shared/ui/Toast";

const PAYPAL_LINK_PREFIX = /^(?:https?:\/\/)?(?:www\.)?paypal\.me\//i;

function ProfileForm({ roomie }: { roomie: Roomie }) {
  const toast = useToast();
  const update = useUpdateProfile();
  const [firstName, setFirstName] = useState(roomie.first_name);
  const [lastName, setLastName] = useState(roomie.last_name ?? "");
  const [paypal, setPaypal] = useState(roomie.paypal_username ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [paypalError, setPaypalError] = useState<string | undefined>();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!firstName.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (password && password.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    const paypalUsername = paypal.trim().replace(PAYPAL_LINK_PREFIX, "").split("/")[0] ?? "";
    if (paypalUsername && !isValidPaypalUsername(paypalUsername)) {
      setPaypalError("Usa entre 3 y 20 letras o números, sin espacios.");
      return;
    }
    setError(null);
    setPaypalError(undefined);
    update.mutate(
      {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        paypal_username: paypalUsername,
        ...(password ? { password } : {}),
      },
      {
        onSuccess: () => {
          toast.success("Perfil actualizado.");
          setPassword("");
        },
        onError: (caught) => setError(errorMessage(caught)),
      },
    );
  }

  return (
    <Card title="Tus datos">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && <ErrorNotice message={error} />}
        <TextField label="Correo electrónico" value={roomie.email} readOnly />
        <TextField
          label="Nombre"
          autoComplete="given-name"
          required
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
        />
        <TextField
          label="Apellidos"
          autoComplete="family-name"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
        />
        <TextField
          label="Usuario de PayPal.Me"
          hint="Tu nombre de usuario de paypal.me, por ejemplo «lucia». También puedes pegar el enlace completo. Tus compis lo usarán para pagarte."
          error={paypalError}
          value={paypal}
          onChange={(event) => setPaypal(event.target.value)}
        />
        <TextField
          label="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          hint="Déjala vacía si no quieres cambiarla."
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit" loading={update.isPending}>
          Guardar cambios
        </Button>
      </form>
    </Card>
  );
}

function DeleteAccount({ roomie }: { roomie: Roomie }) {
  const toast = useToast();
  const { signOut } = useAuth();
  const deactivate = useDeactivateAccount();
  const [confirming, setConfirming] = useState(false);

  return (
    <Card title="Eliminar cuenta">
      {roomie.home_id !== null ? (
        <p>Para eliminar tu cuenta primero tienes que salir de la vivienda.</p>
      ) : (
        <>
          <p>Se borrarán tus datos personales. No se puede deshacer.</p>
          <div>
            <Button variant="danger" onClick={() => setConfirming(true)}>
              Eliminar mi cuenta
            </Button>
          </div>
        </>
      )}
      <ConfirmDialog
        open={confirming}
        title="Eliminar cuenta"
        message="¿Seguro que quieres eliminar tu cuenta? Esta acción no se puede deshacer."
        confirmLabel="Eliminar cuenta"
        loading={deactivate.isPending}
        onClose={() => setConfirming(false)}
        onConfirm={() =>
          deactivate.mutate(undefined, {
            onSuccess: () => signOut(),
            onError: (caught) => {
              toast.error(errorMessage(caught));
              setConfirming(false);
            },
          })
        }
      />
    </Card>
  );
}

export function ProfilePage() {
  useDocumentTitle("Mi perfil");
  const { data: roomie, isPending, error } = useCurrentRoomie();

  return (
    <>
      <PageHeader title="Mi perfil" />
      {isPending && <Loading />}
      {error && <ErrorNotice message={errorMessage(error)} />}
      {roomie && (
        <div className="flex flex-col gap-6">
          <ProfileForm key={roomie.id} roomie={roomie} />
          <DeleteAccount roomie={roomie} />
        </div>
      )}
    </>
  );
}
