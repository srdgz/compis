import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { errorMessage } from "@/shared/api/http";
import { DEMO_ACCOUNT } from "@/shared/config";
import { useDelayed } from "@/shared/lib/useDelayed";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { Button } from "@/shared/ui/Button";
import { ErrorNotice, SLOW_LOADING_MESSAGE, SLOW_LOADING_MS } from "@/shared/ui/Feedback";
import { PasswordField, TextField } from "@/shared/ui/Field";

import { useAuth } from "../AuthProvider";
import { AuthLayout } from "./AuthLayout";

export function LoginPage() {
  useDocumentTitle("Iniciar sesión");
  const { session, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"form" | "demo" | null>(null);
  const slow = useDelayed(submitting !== null, SLOW_LOADING_MS);

  if (session) return <Navigate to="/" replace />;

  const destination = (location.state as { from?: string } | null)?.from ?? "/";

  async function attempt(kind: "form" | "demo", emailValue: string, passwordValue: string) {
    setSubmitting(kind);
    setError(null);
    try {
      await signIn(emailValue, passwordValue);
      navigate(destination, { replace: true });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSubmitting(null);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    void attempt("form", email, password);
  }

  return (
    <AuthLayout title="Te damos la bienvenida" description="Entra para ver cómo va la casa.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {error && <ErrorNotice message={error} />}
        <TextField
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <PasswordField
          label="Contraseña"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button
          type="submit"
          loading={submitting === "form"}
          loadingLabel="Entrando"
          disabled={submitting === "demo"}
        >
          Entrar
        </Button>
      </form>
      <div className="flex flex-col gap-4 border-t border-line pt-6">
        <Button
          variant="secondary"
          loading={submitting === "demo"}
          loadingLabel="Entrando"
          disabled={submitting === "form"}
          onClick={() => void attempt("demo", DEMO_ACCOUNT.email, DEMO_ACCOUNT.password)}
        >
          Probar con una cuenta demo
        </Button>
        {slow && (
          <p role="status" className="text-center text-sm text-muted">
            {SLOW_LOADING_MESSAGE}
          </p>
        )}
        <p className="text-center">
          ¿Aún no tienes cuenta?{" "}
          <Link to="/signup" className="font-semibold text-brand underline">
            Crear cuenta
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
