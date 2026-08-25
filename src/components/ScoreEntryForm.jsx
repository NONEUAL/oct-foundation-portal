import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

export default function ScoreEntryForm({ match, onUpdated }) {
  const { user } = useAuth();
  const [scoreA, setScoreA] = useState(match.score_a ?? 0);
  const [scoreB, setScoreB] = useState(match.score_b ?? 0);
  const [status, setStatus] = useState("idle"); // idle | saving | error
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
      // RLS will reject this with a permissions-style error if the
      // moderator isn't actually assigned to either department in this
      // match — surface that plainly rather than a raw Postgres message.
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
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <input
        type="number"
        min="0"
        value={scoreA}
        onChange={(e) => setScoreA(e.target.value)}
        className="w-16 rounded border border-line bg-court px-2 py-1 text-center font-mono text-sm text-chalk"
      />
      <span className="font-mono text-xs text-mute">–</span>
      <input
        type="number"
        min="0"
        value={scoreB}
        onChange={(e) => setScoreB(e.target.value)}
        className="w-16 rounded border border-line bg-court px-2 py-1 text-center font-mono text-sm text-chalk"
      />
      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded bg-scoreboard px-3 py-1.5 font-mono text-xs text-court disabled:opacity-50"
      >
        {status === "saving" ? "SAVING…" : "UPDATE"}
      </button>
      {status === "error" && (
        <span className="text-xs text-ember">{errorMessage}</span>
      )}
    </form>
  );
}