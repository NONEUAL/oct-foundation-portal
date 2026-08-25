import { useState } from "react";
import { Link } from "react-router-dom";
import Chronicle from "./Chronicle";
import Arena from "./Arena";
import SpiritMeter from "./SpiritMeter";
import Pageantry from "./Pageantry";
import octLogo from "../assets/oct-logo.png";

const MODULES = [
  { id: "chronicle", label: "Chronicle", ready: true },
  { id: "arena", label: "Arena", ready: true },
  { id: "spirit", label: "Spirit Meter", ready: true },
  { id: "pageantry", label: "Pageantry", ready: true },
];

export default function PublicPortal() {
  const [activeModule, setActiveModule] = useState("chronicle");

  return (
    <div className="min-h-screen bg-court text-chalk">
      <header className="border-b border-line px-4 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img
              src={octLogo}
              alt="Olivarez College – Tagaytay seal"
              className="h-11 w-11 flex-shrink-0 drop-shadow-[0_0_10px_rgba(221,169,104,0.35)]"
            />
            <div>
              <div className="font-display text-2xl leading-none tracking-wide">
                OCT FOUNDATION WEEK
              </div>
              <div className="mt-1 font-mono text-[10px] tracking-[0.2em] text-mute">
                MIND · BODY · SOUL
              </div>
            </div>
          </div>
          <Link
            to="/moderator"
            className="mt-1 font-mono text-[11px] tracking-wide text-mute hover:text-scoreboard"
          >
            MOD LOGIN →
          </Link>
        </div>
        <nav className="mt-4 flex gap-6">
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

      <main>
        {activeModule === "chronicle" && <Chronicle />}
        {activeModule === "arena" && <Arena />}
        {activeModule === "spirit" && <SpiritMeter />}
        {activeModule === "pageantry" && <Pageantry />}
      </main>
    </div>
  );
}