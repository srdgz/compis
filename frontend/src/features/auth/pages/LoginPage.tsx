import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { errorMessage } from "@/shared/api/http";
import { DEMO_ACCOUNT } from "@/shared/config";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { Button } from "@/shared/ui/Button";
import { TextField } from "@/shared/ui/Field";
import { ErrorNotice } from "@/shared/ui/Feedback";

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
  const [submitting, setSubmitting] = useState(false);

  if (session) return <Navigate to="/" replace />;

  const destination = (location.state as { from?: string } | null)?.from ?? "/";

  async function attempt(emailValue: string, passwordValue: string) {
    setSubmitting(true);
    setError(null);
    try {
      await signIn(emailValue, passwordValue);
      navigate(destination, { replace: true });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void attempt(email, password);
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
        <TextField
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit" loading={submitting}>
          Entrar
        </Button>
      </form>
      <div className="flex flex-col gap-3 border-t border-line pt-6">
        <Button
          variant="secondary"
          disabled={submitting}
          onClick={() => void attempt(DEMO_ACCOUNT.email, DEMO_ACCOUNT.password)}
        >
          Probar con una cuenta de demostración
        </Button>
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
