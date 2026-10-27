import { useState } from "react";
import type { FormEvent } from "react";

import type { Roomie } from "@/features/roomies/api";
import { errorMessage } from "@/shared/api/http";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { Button } from "@/shared/ui/Button";
import { TextField } from "@/shared/ui/Field";
import { Card, ErrorNotice, PageHeader } from "@/shared/ui/Feedback";
import { useToast } from "@/shared/ui/Toast";

import { useCreateHome } from "./hooks";

export function OnboardingPage({ roomie }: { roomie: Roomie }) {
  useDocumentTitle("Tu vivienda");
  const toast = useToast();
  const createHome = useCreateHome();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Escribe un nombre para la vivienda.");
      return;
    }
    setError(null);
    createHome.mutate(name.trim(), {
      onSuccess: () => toast.success("Vivienda creada. ¡Ya puedes invitar a tus compis!"),
      onError: (caught) => setError(errorMessage(caught)),
    });
  }

  return (
    <>
      <PageHeader
        title={`Hola, ${roomie.first_name}`}
        description="Todavía no formas parte de ninguna vivienda."
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Crear una vivienda nueva">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {error && <ErrorNotice message={error} />}
            <TextField
              label="Nombre de la vivienda"
              required
              maxLength={60}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Button type="submit" loading={createHome.isPending}>
              Crear vivienda
            </Button>
          </form>
        </Card>
        <Card title="Unirte a una vivienda">
          <p>
            Pide a quien administre tu vivienda que te añada con este correo. Después, recarga esta
            página.
          </p>
          <p className="break-all rounded-xl bg-mint px-4 py-3 font-semibold">{roomie.email}</p>
        </Card>
      </div>
    </>
  );
}
