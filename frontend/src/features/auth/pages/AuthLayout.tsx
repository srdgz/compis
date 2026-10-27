import type { ReactNode } from "react";

import { Logo } from "@/shared/ui/Logo";

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-4 py-10">
      <Logo size={48} />
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl">{title}</h1>
        <p className="text-muted">{description}</p>
      </div>
      {children}
    </main>
  );
}
