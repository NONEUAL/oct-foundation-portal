import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

const field = "min-h-12 w-20 rounded-xl border border-line bg-surface text-center text-lg font-bold focus:border-mid";

export default function ScoreEntryForm({ match, onUpdated }) {
  const { user } = useAuth();
  const [scoreA, setScoreA] = useState(match.score_a ?? 0);
  const [scoreB, setScoreB] = useState(match.score_b ?? 0);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("saving");
    setErrorMessage("");
    const { error } = await supabase.from("score_updates").insert({
      match_id: match.id,
      updated_by: user.id,
      new_score_a: Number(scoreA),
      new_score_b: Number(scoreB),
    });
    if (error) {
      setStatus("error");
      setErrorMessage(
        error.code === "42501" || error.message.includes("policy")
          ? "You're not assigned to a department in this match, so this update was blocked."
          : error.message
      );
      return;
    }
    setStatus("idle");
    onUpdated?.();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`a-${match.id}`}>Score for team A</label>
      <input id={`a-${match.id}`} type="number" inputMode="numeric" min="0" value={scoreA} onChange={(e) => setScoreA(e.target.value)} className={field} />
      <span className="font-bold text-soft">–</span>
      <label className="sr-only" htmlFor={`b-${match.id}`}>Score for team B</label>
      <input id={`b-${match.id}`} type="number" inputMode="numeric" min="0" value={scoreB} onChange={(e) => setScoreB(e.target.value)} className={field} />
      <button type="submit" disabled={status === "saving"} className="min-h-12 rounded-xl bg-forest px-5 font-semibold text-white disabled:opacity-50">
        {status === "saving" ? "Saving…" : "Update score"}
      </button>
      {status === "error" && <p role="alert" className="w-full text-sm font-semibold text-live">{errorMessage}</p>}
    </form>
  );
}
