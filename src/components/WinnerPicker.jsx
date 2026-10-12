import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Two big buttons, then a confirm step so a stray tap can't advance a team.
export default function WinnerPicker({ match, departments, isAdmin, onDone }) {
  const a = departments[match.department_a_id];
  const b = departments[match.department_b_id];
  const [choice, setChoice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const decided = match.winner_department_id;

  async function run(fn) {
    setBusy(true);
    setError("");
    const { error: err } = await fn();
    setBusy(false);
    if (err) {
      setError(err.code === "42501" ? "You can only declare winners for matches that involve your department." : err.message);
      return;
    }
    setChoice(null);
    onDone?.();
  }

  if (!a || !b) return <p className="text-sm text-soft">Waiting for earlier rounds to finish.</p>;

  if (decided) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-gold px-3 py-1 text-sm font-bold text-ink">Winner: {departments[decided]?.code}</span>
        {isAdmin && (
          <button
            disabled={busy}
            onClick={() => run(() => supabase.rpc("undo_winner", { p_match_id: match.id }))}
            className="min-h-11 rounded-xl border border-line px-4 text-sm font-semibold text-forest hover:bg-hover disabled:opacity-50"
          >
            Undo
          </button>
        )}
        {error && <p role="alert" className="w-full text-sm font-semibold text-live">{error}</p>}
      </div>
    );
  }

  if (choice) {
    const picked = departments[choice];
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Declare <span className="text-ink">{picked?.code}</span> the winner? This moves them to the next round.</p>
        <div className="flex gap-2">
          <button
            disabled={busy}
            onClick={() => run(() => supabase.rpc("declare_winner", { p_match_id: match.id, p_winner_id: choice }))}
            className="min-h-12 flex-1 rounded-xl bg-gold font-bold text-ink disabled:opacity-50"
          >
            {busy ? "Saving…" : "Yes, confirm"}
          </button>
          <button onClick={() => setChoice(null)} className="min-h-12 rounded-xl border border-line px-4 font-semibold text-forest">Cancel</button>
        </div>
        {error && <p role="alert" className="text-sm font-semibold text-live">{error}</p>}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {[a, b].map((d) => (
        <button key={d.id} onClick={() => setChoice(d.id)} className="min-h-12 rounded-xl bg-forest font-semibold text-white hover:bg-ink">
          {d.code} wins
        </button>
      ))}
    </div>
  );
}
