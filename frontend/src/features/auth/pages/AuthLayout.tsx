import { CalendarDays, ShoppingBasket, Wallet } from "lucide-react";
import type { ReactNode } from "react";

import { Logo } from "@/shared/ui/Logo";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";

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
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="flex flex-col justify-between gap-10 bg-mint px-6 py-8 lg:px-12 lg:py-14">
        <Logo size={48} />
        <div className="hidden flex-col gap-6 lg:flex">
          <p className="max-w-md font-display text-5xl font-extrabold leading-tight tracking-tight">
            Casa compartida, cuentas claras.
          </p>
          <ul className="flex max-w-md flex-col gap-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <Icon aria-hidden="true" className="mt-0.5 shrink-0 text-brand" size={22} />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="hidden text-muted lg:block">Hecho para quienes comparten piso.</p>
      </aside>

      <main className="mx-auto flex w-full max-w-md flex-col justify-center gap-8 px-4 py-10 lg:px-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl">{title}</h1>
          <p className="text-muted">{description}</p>
        </div>
        {children}
        <div className="w-40 border-t border-line pt-6">
          <ThemeToggle />
        </div>
      </main>
    </div>
  );
}
