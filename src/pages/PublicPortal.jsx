import { useState } from "react";
import { Link } from "react-router-dom";
import Chronicle from "./Chronicle";

const MODULES = [
  { id: "chronicle", label: "Chronicle", ready: true },
  { id: "arena", label: "Arena", ready: false },
  { id: "spirit", label: "Spirit Meter", ready: false },
  { id: "pageantry", label: "Pageantry", ready: false },
];

export default function PublicPortal() {
  const [activeModule, setActiveModule] = useState("chronicle");

  return (
    <div className="min-h-screen bg-court text-chalk">
      <header className="border-b border-line px-4 py-4">
        <div className="flex items-start justify-between">
          <div className="font-display text-lg tracking-wide">
            OCT FOUNDATION WEEK
          </div>
          <Link
            to="/moderator"
            className="font-mono text-[11px] tracking-wide text-mute hover:text-scoreboard"
          >
            MOD LOGIN →
          </Link>
        </div>
        <nav className="mt-3 flex gap-6">
          {MODULES.map((mod) => (
            <button
              key={mod.id}
              onClick={() => mod.ready && setActiveModule(mod.id)}
              disabled={!mod.ready}
              className={[
                "font-mono text-xs tracking-wide pb-1 border-b-2 transition-colors",
                activeModule === mod.id
                  ? "text-scoreboard border-scoreboard"
                  : mod.ready
                  ? "text-mute border-transparent hover:text-chalk"
                  : "text-line border-transparent cursor-not-allowed",
              ].join(" ")}
            >
              {mod.label.toUpperCase()}
              {!mod.ready && <span className="ml-1">·soon</span>}
            </button>
          ))}
        </nav>
      </header>

      <main>{activeModule === "chronicle" && <Chronicle />}</main>
    </div>
  );
}
