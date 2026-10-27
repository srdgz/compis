import {
  Banknote,
  CalendarDays,
  FolderOpen,
  Home,
  ListChecks,
  LogOut,
  Menu,
  Newspaper,
  ShoppingBasket,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/features/auth/AuthProvider";
import { useCurrentRoomie } from "@/features/roomies/hooks";
import { cx } from "@/shared/lib/format";
import { Button } from "@/shared/ui/Button";
import { Logo } from "@/shared/ui/Logo";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";

const NAV = [
  { to: "/", label: "Inicio", icon: Home, end: true },
  { to: "/tasks", label: "Tareas", icon: ListChecks },
  { to: "/shopping", label: "Compra", icon: ShoppingBasket },
  { to: "/expenses", label: "Gastos y deudas", icon: Banknote },
  { to: "/calendar", label: "Calendario", icon: CalendarDays },
  { to: "/files", label: "Archivos", icon: FolderOpen },
  { to: "/activity", label: "Novedades", icon: Newspaper },
  { to: "/roomies", label: "Roomies", icon: Users },
  { to: "/profile", label: "Mi perfil", icon: User },
] as const;

export function AppShell() {
  const { signOut } = useAuth();
  const { data: roomie } = useCurrentRoomie();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const first = useRef(true);

  useEffect(() => {
    setMenuOpen(false);
    if (first.current) {
      first.current = false;
      return;
    }
    mainRef.current?.focus();
  }, [location.pathname]);

  return (
    <div className="min-h-screen md:grid md:grid-cols-[17rem_1fr]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-brand focus:px-4 focus:py-3 focus:font-semibold focus:text-on-brand"
      >
        Saltar al contenido
      </a>

      <aside
        aria-label="Menú y cuenta"
        className="border-b border-line bg-surface md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-6">
          <Logo />
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border-2 border-ink md:hidden"
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            <span className="sr-only">{menuOpen ? "Cerrar menú" : "Abrir menú"}</span>
          </button>
        </div>

        <nav
          id="main-nav"
          aria-label="Principal"
          className={cx(
            "px-3 pb-4 md:flex md:h-[calc(100vh-6rem)] md:flex-col",
            !menuOpen && "hidden md:flex",
          )}
        >
          <ul className="flex flex-col gap-1">
            {NAV.map(({ to, label, icon: Icon, ...rest }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={"end" in rest}
                  className={({ isActive }) =>
                    cx(
                      "flex min-h-11 items-center gap-3 rounded-xl px-3 font-semibold",
                      isActive ? "bg-brand text-on-brand" : "hover:bg-mint",
                    )
                  }
                >
                  <Icon aria-hidden="true" size={20} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 md:mt-auto">
            {roomie && <p className="px-3 text-sm text-muted">Sesión de {roomie.first_name}</p>}
            <ThemeToggle />
            <Button variant="secondary" onClick={signOut}>
              <LogOut aria-hidden="true" size={18} />
              Cerrar sesión
            </Button>
          </div>
        </nav>
      </aside>

      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 outline-none md:px-10"
      >
        <Outlet />
      </main>
    </div>
  );
}
