import { Link } from "react-router-dom";

import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { EmptyState, PageHeader } from "@/shared/ui/Feedback";

export function NotFoundPage() {
  useDocumentTitle("Página no encontrada");
  return (
    <>
      <PageHeader title="Página no encontrada" />
      <EmptyState title="Esta dirección no existe">
        <Link to="/" className="font-semibold text-brand underline">
          Volver al inicio
        </Link>
      </EmptyState>
    </>
  );
}
