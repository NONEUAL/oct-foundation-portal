import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getFingerprint } from "../lib/fingerprint";

const storageKey = (eventId, matchId) => `oct-fan-pick:${eventId}:${matchId ?? "champion"}`;

function readMine(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writeMine(key, value) {
  try { localStorage.setItem(key, value); } catch { /* private mode: pick still counts */ }
}

// "Who do you want to win?" Fun only: picks never touch official results.
export default function FanPick({ eventId, matchId = null, options, label = "Who do you want to win?" }) {
  const key = storageKey(eventId, matchId);
  const [mine, setMine] = useState(() => readMine(key));
  const [counts, setCounts] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadCounts() {
      let q = supabase.from("fan_pick_counts").select("department_id, picks").eq("event_id", eventId);
      q = matchId ? q.eq("match_id", matchId) : q.is("match_id", null);
      const { data } = await q;
      if (cancelled) return;
      const next = {};
      (data || []).forEach((r) => (next[r.department_id] = r.picks));
      setCounts(next);
    }
    loadCounts();
    return () => { cancelled = true; };
  }, [eventId, matchId, mine]);

  async function pick(deptId) {
    setBusy(true);
    setError("");
    const { error: err } = await supabase.rpc("submit_fan_pick", {
      p_event_id: eventId,
      p_match_id: matchId,
      p_department_id: deptId,
      p_fingerprint: getFingerprint(),
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    writeMine(key, deptId);
    setMine(deptId);
  }

  const total = options.reduce((n, o) => n + (counts[o.id] ?? 0), 0);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-soft">{label}</p>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(options.length, 2)}, minmax(0, 1fr))` }}>
        {options.map((o) => {
          const picked = mine === o.id;
          const pct = total ? Math.round(((counts[o.id] ?? 0) / total) * 100) : 0;
          return (
            <button
              key={o.id}
              onClick={() => pick(o.id)}
              disabled={busy}
              aria-pressed={picked}
              className={[
                "relative min-h-12 overflow-hidden rounded-xl border px-3 text-left disabled:opacity-60",
                picked ? "border-mid bg-hover" : "border-line bg-surface hover:bg-tint",
              ].join(" ")}
            >
              {mine && <span className="absolute inset-y-0 left-0 bg-line/60" style={{ width: `${pct}%` }} aria-hidden="true" />}
              <span className="relative flex items-center justify-between gap-2">
                <span className="font-display text-lg font-bold">{o.code}</span>
                {mine && <span className="text-sm font-semibold text-soft">{pct}%</span>}
              </span>
            </button>
          );
        })}
      </div>
      {mine && <p className="text-xs text-soft">Thanks. Your pick is for fun and never changes the official result. Tap another team to change it.</p>}
      {error && <p role="alert" className="text-sm font-semibold text-live">{error.includes("closed") ? "Picks are closed." : error}</p>}
    </div>
  );
}
