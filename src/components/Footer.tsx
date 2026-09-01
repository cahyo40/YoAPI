import { Link } from "react-router-dom";

/** Slim footer bar — brand signature across surfaces. */
export default function Footer() {
  return (
    <footer className="flex shrink-0 items-center justify-between border-t border-border bg-surface px-4 py-2 text-[12px] text-text-faint">
      <div className="flex items-center gap-3">
        <span className="font-mono tracking-[0.14em]">YoDev</span>
        <span>•</span>
        <Link to="/about" className="transition hover:text-signal">
          Tentang YoApi
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <a
          href="https://github.com/cahyo40/YoAPI"
          target="_blank"
          rel="noreferrer"
          className="transition hover:text-signal"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
