import { useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import BracketView from "../../components/BracketView";

const SIZES = [2, 4, 8, 16];
const select = "min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-base focus:border-mid";

export default function AdminBracket({ events, matches, departments, reload }) {
  const deptList = useMemo(() => Object.values(departments), [departments]);
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [size, setSize] = useState(8);
  const [bestOf, setBestOf] = useState(3);
  const [seeds, setSeeds] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const slots = Array.from({ length: size }, (_, i) => seeds[i] ?? "");
  const chosen = slots.filter(Boolean);
  const duplicates = chosen.length !== new Set(chosen).size;
  const ready = chosen.length === size && !duplicates && !!eventId;
  const existing = matches.filter((m) => m.event_id === eventId);
  const hasResults = existing.some((m) => m.winner_department_id);

  function setSeed(i, id) {
    const next = [...slots];
    next[i] = id;
    setSeeds(next);
  }
  function autoFill() {
    setSeeds(deptList.slice(0, size).map((d) => d.id));
  }

  async function generate() {
    if (existing.length > 0 && !window.confirm("This replaces the current bracket for this event. Continue?")) return;
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.rpc("create_bracket", { p_event_id: eventId, p_team_ids: slots, p_best_of: bestOf });
    setBusy(false);
    if (error) { setMessage({ ok: false, text: error.message }); return; }
    setMessage({ ok: true, text: "Bracket created. It is live on the Arena page." });
    reload();
  }

  const pairings = Array.from({ length: size / 2 }, (_, i) => [slots[i], slots[size - 1 - i]]);
  const code = (id) => departments[id]?.code ?? "?";

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
        <h1 className="font-display text-2xl font-bold text-ink">Bracket maker</h1>

        <label className="flex flex-col gap-1 text-sm font-semibold">Event
          <select className={select} value={eventId} onChange={(e) => setEventId(e.target.value)}>
            {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </label>

        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm font-semibold">Format</legend>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" aria-pressed="true" className="min-h-12 rounded-xl bg-forest font-semibold text-white">Single elimination</button>
            <button type="button" disabled title="Not supported yet" className="min-h-12 rounded-xl border border-line font-semibold text-muted">Double (soon)</button>
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm font-semibold">Teams
            <select className={select} value={size} onChange={(e) => setSize(Number(e.target.value))}>
              {SIZES.map((n) => <option key={n} value={n}>{n} teams</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">Match length
            <select className={select} value={bestOf} onChange={(e) => setBestOf(Number(e.target.value))}>
              {[1, 3, 5].map((n) => <option key={n} value={n}>Best of {n}</option>)}
            </select>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Seeds</h2>
            <button type="button" onClick={autoFill} className="min-h-11 rounded-xl px-3 text-sm font-semibold text-forest underline">Fill in order</button>
          </div>
          {slots.map((id, i) => (
            <label key={i} className="flex items-center gap-2 text-sm font-semibold">
              <span className="min-w-14 shrink-0 text-soft">Seed {i + 1}</span>   
              <select className={select} value={id} onChange={(e) => setSeed(i, e.target.value)}>
                <option value="">Choose…</option>
                {deptList.map((d) => <option key={d.id} value={d.id}>{d.code} · {d.name}</option>)}
              </select>
            </label>
          ))}
          {duplicates && <p role="alert" className="text-sm font-semibold text-live">A team is picked twice.</p>}
        </div>

        {hasResults && <p role="alert" className="text-sm font-semibold text-live">This bracket already has results, so it can't be rebuilt. Undo winners first.</p>}
        <button type="button" onClick={generate} disabled={!ready || busy || hasResults} className="min-h-12 rounded-xl bg-gold font-bold text-ink disabled:opacity-40">
          {busy ? "Creating…" : existing.length ? "Rebuild bracket" : "Create bracket"}
        </button>
        {message && <p role={message.ok ? "status" : "alert"} className={`text-sm font-semibold ${message.ok ? "text-soft" : "text-live"}`}>{message.text}</p>}
      </section>

      <section className="flex min-w-0 flex-col gap-5">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="font-display text-xl font-bold text-ink">Round 1 pairings</h2>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {pairings.map(([a, b], i) => (
              <li key={i} className="flex items-center justify-between rounded-xl bg-tint px-3 py-2 font-display text-lg font-bold">
                <span>{a ? code(a) : "TBD"}</span><span className="text-sm font-medium text-soft">vs</span><span>{b ? code(b) : "TBD"}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="mb-3 font-display text-xl font-bold text-ink">Current bracket</h2>
          <BracketView matches={existing.filter((m) => m.round != null)} departments={departments} />
        </div>
      </section>
    </div>
  );
}
