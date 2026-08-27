import { Link, useLocation } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { IconConsole, IconClock, IconSun, IconMoon, IconLogout, IconMenu } from "./icons.tsx";

/**
 * Instrument header — wordmark + logo, Console/History nav, theme switch,
 * session identity (avatar + email) + control. Shared across Dashboard and
 * History so the case feels continuous (craft floor: same chrome screen to screen).
 * onMenu (opsional): tampilkan tombol hamburger (mobile) untuk buka sidebar.
 */
export default function AppHeader({
  dark,
  user,
  onToggleTheme,
  onLogout,
  onMenu,
}: {
  dark: boolean;
  user: User | null;
  onToggleTheme: () => void;
  onLogout: () => void;
  onMenu?: () => void;
}) {
  const { pathname } = useLocation();
  const email = user?.email ?? "";
  const avatar = (user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? "") as string;

  return (
    <header className="flex items-center gap-3 border-b border-border bg-surface px-3 py-2.5 sm:gap-6 sm:px-4">
      {onMenu && (
        <button
          onClick={onMenu}
          className="-ml-1 shrink-0 rounded-md p-2 text-text-dim transition hover:bg-surface-2 hover:text-signal md:hidden"
          aria-label="Buka panel folder"
        >
          <IconMenu size={18} />
        </button>
      )}
      <Link to="/" className="group flex shrink-0 items-center gap-2.5" aria-label="YoApi beranda">
        <img src="/icon.svg" alt="" aria-hidden className="signal-live h-6 w-6" />
        <span className="font-mono text-[16px] font-bold tracking-tight text-text">
          Yo<span className="text-signal">Api</span>
        </span>
      </Link>

      <nav className="flex items-center gap-1">
        <NavLink to="/" active={pathname === "/"} icon={<IconConsole size={15} />}>
          Console
        </NavLink>
        <NavLink to="/history" active={pathname === "/history"} icon={<IconClock size={15} />}>
          History
        </NavLink>
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={onToggleTheme}
          className="rounded-md p-2 text-text-dim transition hover:bg-surface-2 hover:text-signal"
          aria-label={dark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
          title={dark ? "Mode terang" : "Mode gelap"}
        >
          {dark ? <IconSun size={16} /> : <IconMoon size={16} />}
        </button>
        {user ? (
          <>
            {/* identity: avatar (if any) + email, hidden on narrow to protect the bar */}
            <span className="ml-1 hidden min-w-0 items-center gap-2 sm:flex" title={email}>
              {avatar ? (
                <img src={avatar} alt="" className="h-6 w-6 shrink-0 rounded-full border border-border object-cover" />
              ) : (
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-2 font-mono text-[11px] font-bold uppercase text-signal">
                  {email.charAt(0) || "?"}
                </span>
              )}
              <span className="max-w-[16ch] truncate font-mono text-[12px] text-text-dim">{email}</span>
            </span>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-text-dim transition hover:bg-surface-2 hover:text-err"
            >
              <IconLogout size={15} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 rounded-lg bg-signal px-3.5 py-1.5 font-mono text-[13px] font-semibold uppercase tracking-[0.06em] text-on-signal shadow-glow transition hover:brightness-110"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}

function NavLink({
  to,
  active,
  icon,
  children,
}: {
  to: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[14px] font-medium transition sm:px-3 ${
        active
          ? "bg-surface-2 text-signal"
          : "text-text-dim hover:bg-surface-2 hover:text-text"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </Link>
  );
}
