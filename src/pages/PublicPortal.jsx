import { useState } from "react";
import { Link } from "react-router-dom";
import Chronicle from "./Chronicle";
import Arena from "./Arena";
import Picks from "./Picks";
import Pageantry from "./Pageantry";
import { Brand, HeaderBar } from "../components/Shell";

const TABS = [
  { id: "chronicle", label: "Schedule", icon: "M7 2v3M17 2v3M3 9h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" },
  { id: "arena", label: "Arena", icon: "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" },
  { id: "picks", label: "Picks", icon: "M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" },
  { id: "pageantry", label: "Pageantry", icon: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z" },
];

function Icon({ d }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function PublicPortal() {
  const [active, setActive] = useState("chronicle");

  return (
    <div className="min-h-screen bg-mint pb-20 lg:pb-0">
      <HeaderBar>
        <Brand />
        <Link to="/moderator" className="flex min-h-11 items-center rounded-xl border border-line/50 px-4 text-sm font-semibold text-white hover:bg-white/10">
          Staff login
        </Link>
      </HeaderBar>

      <div className="mx-auto flex max-w-6xl">
        <nav aria-label="Sections" className="sticky top-0 hidden h-screen w-56 flex-shrink-0 flex-col gap-1 p-4 lg:flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              aria-current={active === t.id ? "page" : undefined}
              className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-left font-semibold ${active === t.id ? "bg-forest text-white" : "text-forest hover:bg-hover"}`}
            >
              <Icon d={t.icon} />{t.label}
            </button>
          ))}
        </nav>
        <main className="min-w-0 flex-1 py-4">
          {active === "chronicle" && <Chronicle />}
          {active === "arena" && <Arena />}
          {active === "picks" && <Picks />}
          {active === "pageantry" && <Pageantry />}
        </main>
      </div>

      <nav aria-label="Sections" className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-line bg-surface lg:hidden">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            aria-current={active === t.id ? "page" : undefined}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${active === t.id ? "text-forest" : "text-muted"}`}
          >
            <span className={`rounded-full px-4 py-1 ${active === t.id ? "bg-hover" : ""}`}><Icon d={t.icon} /></span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
