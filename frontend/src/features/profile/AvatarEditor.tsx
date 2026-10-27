import { Camera, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import type { ChangeEvent } from "react";

import { fullName } from "@/features/roomies/api";
import type { Roomie } from "@/features/roomies/api";
import { useUpdateProfile } from "@/features/roomies/hooks";
import { uploadToCloudinary, uploadsEnabled, validateAvatarFile } from "@/shared/api/cloudinary";
import { errorMessage } from "@/shared/api/http";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { ErrorNotice } from "@/shared/ui/Feedback";
import { useToast } from "@/shared/ui/Toast";

export function AvatarEditor({ roomie }: { roomie: Roomie }) {
  const toast = useToast();
  const update = useUpdateProfile();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enabled = uploadsEnabled();
  const busy = uploading || update.isPending;

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const problem = validateAvatarFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      await update.mutateAsync({ avatar: url });
      toast.success("Foto de perfil actualizada.");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setUploading(false);
    }
  }

  function removePhoto() {
    setError(null);
    update.mutate(
      { avatar: null },
      {
        onSuccess: () => toast.success("Foto de perfil eliminada."),
        onError: (caught) => setError(errorMessage(caught)),
      },
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-center gap-5">
        <Avatar name={roomie.first_name} src={roomie.avatar} size="2xl" />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="min-w-0">
            <p className="break-words font-display text-2xl font-semibold">{fullName(roomie)}</p>
            <p className="break-all text-muted">{roomie.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={input}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(event) => void handleChange(event)}
            />
            <Button
              variant="secondary"
              disabled={!enabled}
              loading={busy}
              onClick={() => input.current?.click()}
            >
              <Camera aria-hidden="true" size={18} />
              {roomie.avatar ? "Cambiar foto" : "Subir foto"}
            </Button>
            {roomie.avatar && (
              <Button variant="ghost" disabled={busy} onClick={removePhoto}>
                <Trash2 aria-hidden="true" size={18} />
                Quitar foto
              </Button>
            )}
          </div>
        </div>
      </div>
      <p className="text-sm text-muted">
        {enabled
          ? "JPG, PNG, WebP o GIF de hasta 5 MB. Se recorta en círculo y la verán tus compis."
          : "La subida de imágenes no está configurada en este entorno."}
      </p>
      {error && <ErrorNotice message={error} />}
    </div>
  );
}
