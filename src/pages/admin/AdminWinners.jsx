import { useState } from "react";
import WinnerPicker from "../../components/WinnerPicker";
import LiveBadge from "../../components/LiveBadge";

export default function AdminWinners({ matches, departments, reload }) {
  const [filter, setFilter] = useState("open");
  const list = matches
    .filter((m) => (filter === "open" ? !m.winner_department_id : !!m.winner_department_id))
    .sort((a, b) => (a.events?.start_time ?? "").localeCompare(b.events?.start_time ?? "") || (a.round ?? 0) - (b.round ?? 0));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl font-bold text-ink">Declare winners</h1>
      <div role="tablist" className="flex max-w-sm gap-1 rounded-2xl bg-hover p-1">
        {[["open", "Waiting"], ["done", "Decided"]].map(([id, label]) => (
          <button key={id} role="tab" aria-selected={filter === id} onClick={() => setFilter(id)}
            className={`min-h-12 flex-1 rounded-xl font-semibold ${filter === id ? "bg-forest text-white" : "text-forest"}`}>{label}</button>
        ))}
      </div>
      {list.length === 0 && <p className="text-sm text-soft">Nothing here.</p>}
      <div className="grid gap-3 lg:grid-cols-2">
        {list.map((m) => (
          <article key={m.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-bold">{m.events?.name}{m.round ? ` · Round ${m.round}` : ""}</h2>
                <p className="font-display text-xl font-bold">{departments[m.department_a_id]?.code ?? "TBD"} <span className="text-sm font-medium text-soft">vs</span> {departments[m.department_b_id]?.code ?? "TBD"}</p>
              </div>
              <LiveBadge status={m.computed_status} />
            </div>
            <WinnerPicker match={m} departments={departments} isAdmin onDone={reload} />
          </article>
        ))}
      </div>
    </div>
  );
}
