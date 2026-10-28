import {
  Banknote,
  CalendarDays,
  FolderOpen,
  Home,
  ListChecks,
  LogOut,
  MoreHorizontal,
  Newspaper,
  ShoppingBasket,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/features/auth/AuthProvider";
import { fullName } from "@/features/roomies/api";
import { useCurrentRoomie } from "@/features/roomies/hooks";
import { cx } from "@/shared/lib/format";
import { DESKTOP_QUERY, useMediaQuery } from "@/shared/lib/useMediaQuery";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { Logo } from "@/shared/ui/Logo";
import { ThemeSwitch } from "@/shared/ui/ThemeSwitch";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const PRIMARY: NavItem[] = [
  { to: "/", label: "Inicio", icon: Home, end: true },
  { to: "/tasks", label: "Tareas", icon: ListChecks },
  { to: "/shopping", label: "Compra", icon: ShoppingBasket },
  { to: "/expenses", label: "Gastos", icon: Banknote },
];

const SECONDARY: NavItem[] = [
  { to: "/calendar", label: "Calendario", icon: CalendarDays },
  { to: "/files", label: "Archivos", icon: FolderOpen },
  { to: "/activity", label: "Novedades", icon: Newspaper },
  { to: "/compis", label: "Compis", icon: Users },
  { to: "/profile", label: "Mi perfil", icon: User },
];

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cx(
          "relative flex min-h-12 items-center gap-3 rounded-2xl px-4 font-semibold",
          isActive
            ? "bg-mint font-bold before:absolute before:bottom-2.5 before:left-0 before:top-2.5 before:w-1 before:rounded-full before:bg-brand"
            : "hover:bg-mint",
        )
      }
    >
      <Icon aria-hidden="true" size={22} />
      {item.label}
    </NavLink>
  );
}

function UserCard() {
  const { data: roomie } = useCurrentRoomie();
  if (!roomie) return null;
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={roomie.first_name} src={roomie.avatar} size="lg" />
      <div className="min-w-0">
        <p className="truncate font-bold">{fullName(roomie)}</p>
        <p className="truncate text-sm text-muted">{roomie.email}</p>
      </div>
    </div>
  );
}

function DesktopSidebar() {
  const { signOut } = useAuth();
  return (
    <aside
      aria-label="Menú y cuenta"
      className="sticky top-0 flex h-dvh w-72 shrink-0 flex-col gap-6 overflow-y-auto border-r border-line bg-surface px-4 py-6"
    >
      <div className="px-3">
        <Logo />
      </div>
      <nav aria-label="Principal">
        <ul className="flex flex-col gap-1">
          {[...PRIMARY, ...SECONDARY].map((item) => (
            <li key={item.to}>
              <SidebarLink item={item} />
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto flex flex-col gap-5 border-t border-line pt-5">
        <UserCard />
        <ThemeSwitch />
        <Button variant="secondary" onClick={signOut}>
          <LogOut aria-hidden="true" size={18} />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}

function MobileShell() {
  const { signOut } = useAuth();
  const { data: roomie } = useCurrentRoomie();
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMoreOpen(false), [location.pathname]);

  const secondaryActive = SECONDARY.some((item) => location.pathname.startsWith(item.to));

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-surface/95 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <Logo size={36} />
        {roomie && (
          <Link to="/profile" aria-label="Mi perfil" className="rounded-full">
            <Avatar name={roomie.first_name} src={roomie.avatar} />
          </Link>
        )}
      </header>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {PRIMARY.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cx(
                    "flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-xs font-semibold",
                    isActive ? "text-brand" : "text-muted",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cx(
                        "inline-flex h-8 w-14 items-center justify-center rounded-full",
                        isActive && "bg-mint",
                      )}
                    >
                      <Icon aria-hidden="true" size={22} />
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => setMoreOpen(true)}
              className={cx(
                "flex min-h-16 w-full flex-col items-center justify-center gap-1 px-1 text-xs font-semibold",
                secondaryActive ? "text-brand" : "text-muted",
              )}
            >
              <span
                className={cx(
                  "inline-flex h-8 w-14 items-center justify-center rounded-full",
                  secondaryActive && "bg-mint",
                )}
              >
                <MoreHorizontal aria-hidden="true" size={22} />
              </span>
              Más
            </button>
          </li>
        </ul>
      </nav>

      <Dialog open={moreOpen} onClose={() => setMoreOpen(false)} title="Más">
        <ul className="flex flex-col gap-1">
          {SECONDARY.map((item) => (
            <li key={item.to}>
              <SidebarLink item={item} onNavigate={() => setMoreOpen(false)} />
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-5 border-t border-line pt-5">
          <UserCard />
          <ThemeSwitch />
          <Button variant="secondary" onClick={signOut}>
            <LogOut aria-hidden="true" size={18} />
            Cerrar sesión
          </Button>
        </div>
      </Dialog>
    </>
  );
}

export function AppShell() {
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    mainRef.current?.focus();
  }, [location.pathname]);

  return (
    <div className={cx("min-h-dvh", desktop && "flex")}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand focus:px-5 focus:py-3 focus:font-semibold focus:text-on-brand"
      >
        Saltar al contenido
      </a>

      {desktop && <DesktopSidebar />}
      {!desktop && <MobileShell />}

      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-8 py-6 pb-28 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] outline-none sm:px-6 lg:flex-1 lg:px-10 lg:py-10 lg:pb-10"
      >
        <Outlet />
      </main>
    </div>
  );
}
