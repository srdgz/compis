import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { errorMessage } from "@/shared/api/http";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { Button } from "@/shared/ui/Button";
import { TextField } from "@/shared/ui/Field";
import { ErrorNotice } from "@/shared/ui/Feedback";
import { useToast } from "@/shared/ui/Toast";

import { authApi } from "../api";
import { useAuth } from "../AuthProvider";
import { AuthLayout } from "./AuthLayout";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

export function validateSignup(name: string, email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!name.trim()) errors.name = "Escribe tu nombre.";
  if (!EMAIL_PATTERN.test(email))
    errors.email = "Escribe un correo con formato nombre@dominio.com.";
  if (password.length < 8) errors.password = "La contraseña debe tener al menos 8 caracteres.";
  return errors;
}

export function SignupPage() {
  useDocumentTitle("Crear cuenta");
  const { session } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (session) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validateSignup(name, email, password);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;
    setSubmitting(true);
    try {
      await authApi.signup({ email: email.trim(), password, first_name: name.trim() });
      toast.success("Cuenta creada. Ya puedes iniciar sesión.");
      navigate("/login");
    } catch (caught) {
      setFormError(errorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Crea tu cuenta" description="Gratis y en menos de un minuto.">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-5"
        noValidate
      >
        {formError && <ErrorNotice message={formError} />}
        <TextField
          label="Nombre"
          autoComplete="given-name"
          required
          value={name}
          error={errors.name}
          onChange={(event) => setName(event.target.value)}
        />
        <TextField
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          required
          value={email}
          error={errors.email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          hint="Mínimo 8 caracteres."
          required
          value={password}
          error={errors.password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit" loading={submitting}>
          Crear cuenta
        </Button>
      </form>
      <p className="text-center">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="font-semibold text-brand underline">
          Iniciar sesión
        </Link>
      </p>
    </AuthLayout>
  );
}
