import { FileText, FolderOpen, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import type { ChangeEvent } from "react";

import { useHomeContext } from "@/features/homes/context";
import { errorMessage } from "@/shared/api/http";
import { formatDay } from "@/shared/lib/format";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/Dialog";
import { EmptyState, ErrorNotice, Loading, PageHeader } from "@/shared/ui/Feedback";
import { useToast } from "@/shared/ui/Toast";

import { uploadsEnabled } from "./api";
import type { FileRecord } from "./api";
import { useDeleteFile, useHomeFiles, useUploadFile } from "./hooks";

export function FilesPage() {
  useDocumentTitle("Archivos");
  const { homeId } = useHomeContext();
  const toast = useToast();
  const files = useHomeFiles(homeId);
  const upload = useUploadFile(homeId);
  const remove = useDeleteFile(homeId);
  const input = useRef<HTMLInputElement>(null);
  const [deleting, setDeleting] = useState<FileRecord | null>(null);
  const enabled = uploadsEnabled();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    upload.mutate(file, {
      onSuccess: () => toast.success(`«${file.name}» subido.`),
      onError: (caught) => toast.error(errorMessage(caught)),
    });
    event.target.value = "";
  }

  return (
    <>
      <PageHeader
        eyebrow="Hogar"
        title="Archivos"
        description="Contratos, facturas y tickets de la casa en un único sitio."
        actions={
          <>
            <input
              ref={input}
              type="file"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={handleChange}
            />
            <Button
              disabled={!enabled}
              loading={upload.isPending}
              onClick={() => input.current?.click()}
            >
              <Upload aria-hidden="true" size={20} />
              Subir archivo
            </Button>
          </>
        }
      />

      {!enabled && (
        <p className="rounded-2xl bg-mint px-4 py-3">
          La subida de archivos no está configurada en este entorno.
        </p>
      )}
      {files.isPending && <Loading />}
      {files.error && <ErrorNotice message={errorMessage(files.error)} />}
      {files.data && files.data.length === 0 && (
        <EmptyState title="Aún no hay archivos" icon={FolderOpen}>
          Sube el primero con el botón de arriba.
        </EmptyState>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {(files.data ?? []).map((file) => (
          <li
            key={file.id}
            className="flex items-center gap-4 rounded-card border border-line bg-surface p-4 shadow-card"
          >
            <span
              aria-hidden="true"
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-mint text-brand"
            >
              <FileText size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all font-semibold text-brand underline"
              >
                {file.name}
                <span className="sr-only"> (se abre en una pestaña nueva)</span>
              </a>
              <p className="text-sm text-muted">Subido el {formatDay(file.upload_date)}</p>
            </div>
            <Button
              variant="ghost"
              className="h-11 w-11 shrink-0 !p-0 text-danger"
              aria-label={`Eliminar ${file.name}`}
              onClick={() => setDeleting(file)}
            >
              <Trash2 aria-hidden="true" size={20} />
            </Button>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={deleting !== null}
        title="Eliminar archivo"
        message={`¿Seguro que quieres eliminar «${deleting?.name ?? ""}»?`}
        confirmLabel="Eliminar"
        loading={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, {
            onSuccess: () => {
              toast.success("Archivo eliminado.");
              setDeleting(null);
            },
            onError: (caught) => toast.error(errorMessage(caught)),
          });
        }}
      />
    </>
  );
}
