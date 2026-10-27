import { CalendarDays, ShoppingBasket, Wallet } from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";

import { applyTheme, getThemePreference } from "@/shared/lib/theme";
import { LivingRoom } from "@/shared/ui/LivingRoom";
import { Logo } from "@/shared/ui/Logo";

const HIGHLIGHTS = [
  { icon: CalendarDays, text: "Tareas con fecha y reparto justo entre todos." },
  { icon: ShoppingBasket, text: "Lista de la compra compartida que se convierte en gasto." },
  { icon: Wallet, text: "Deudas claras, con pago por PayPal.Me o en efectivo." },
] as const;

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  useEffect(() => {
    applyTheme("system");
    return () => applyTheme(getThemePreference());
  }, []);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-2">
      <aside className="flex flex-col items-center gap-6 bg-mint px-6 py-8 sm:px-10 lg:min-h-dvh lg:justify-between lg:gap-8 lg:px-14 lg:py-12">
        <div className="w-full max-w-xl">
          <Logo size={44} />
        </div>
        <div className="flex w-full max-w-xl flex-col gap-6">
          <p className="font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            Casa compartida, cuentas claras.
          </p>
          <LivingRoom className="hidden w-full max-w-lg self-center drop-shadow-sm md:block" />
          <ul className="hidden max-w-xl flex-col gap-4 lg:flex">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <Icon aria-hidden="true" className="mt-0.5 shrink-0 text-brand" size={22} />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="hidden w-full max-w-xl text-muted lg:block">
          Hecho para quienes comparten piso.
        </p>
      </aside>

      <main className="mx-auto flex w-full max-w-md flex-col justify-center gap-8 px-4 py-10 sm:px-0 lg:py-14">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl sm:text-5xl">{title}</h1>
          <p className="text-lg text-muted">{description}</p>
        </div>
        {children}
      </main>
    </div>
  );
}
