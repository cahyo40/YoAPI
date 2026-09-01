import { Link, useLocation } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { IconConsole, IconClock, IconInfo, IconSun, IconMoon, IconLogout, IconMenu } from "./icons.tsx";

/**
 * Instrument header — wordmark + logo, Console/History/About nav, theme switch,
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
    <header className="flex h-13 shrink-0 items-center justify-between border-b border-border bg-surface px-3.5 sm:px-6">
      <div className="flex items-center gap-2.5 sm:gap-5">
        {onMenu && (
          <button
            onClick={onMenu}
            className="-ml-1 shrink-0 rounded-lg p-1.5 text-text-dim transition hover:bg-surface-2 hover:text-signal lg:hidden"
            aria-label="Buka panel folder"
          >
            <IconMenu size={18} />
          </button>
        )}
        <Link to="/" className="group flex shrink-0 items-center gap-2.5" aria-label="YoApi beranda">
          <img src="/icon.svg" alt="" aria-hidden className="signal-live h-5.5 w-5.5" />
          <span className="font-mono text-[15px] font-bold tracking-tight text-text">
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
          <NavLink to="/about" active={pathname === "/about"} icon={<IconInfo size={15} />}>
            About
          </NavLink>
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleTheme}
          className="rounded-lg p-2 text-text-dim transition hover:bg-surface-2 hover:text-signal"
          aria-label={dark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
          title={dark ? "Mode terang" : "Mode gelap"}
        >
          {dark ? <IconSun size={16} /> : <IconMoon size={16} />}
        </button>
        {user ? (
          <>
            {/* identity: avatar (if any) + email, hidden on narrow to protect the bar */}
            <span className="ml-1 hidden min-w-0 items-center gap-2 rounded-full border border-border bg-surface-2 px-2.5 py-1 sm:flex" title={email}>
              {avatar ? (
                <img src={avatar} alt="" className="h-5.5 w-5.5 shrink-0 rounded-full border border-border object-cover" />
              ) : (
                <span className="grid h-5.5 w-5.5 shrink-0 place-items-center rounded-full bg-surface font-mono text-[10px] font-bold uppercase text-signal">
                  {email.charAt(0) || "?"}
                </span>
              )}
              <span className="max-w-[15ch] truncate font-mono text-[11px] text-text-dim">{email}</span>
            </span>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-text-dim transition hover:bg-surface-2 hover:text-err"
            >
              <IconLogout size={15} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-signal px-4 font-mono text-[12px] font-semibold uppercase tracking-[0.06em] text-on-signal shadow-glow transition hover:brightness-110 active:brightness-95"
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
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
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
