import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getFingerprint } from "../lib/fingerprint";

export default function VoteButton({ candidateId, initialCount }) {
  const [hasVoted, setHasVoted] = useState(undefined); // undefined = checking
  const [count, setCount] = useState(initialCount);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCancelled = false;
    async function checkExisting() {
      const { data } = await supabase
        .from("votes")
        .select("id")
        .eq("candidate_id", candidateId)
        .eq("fingerprint_hash", getFingerprint())
        .maybeSingle();
      if (!isCancelled) setHasVoted(Boolean(data));
    }
    checkExisting();
    return () => {
      isCancelled = true;
    };
  }, [candidateId]);

  async function vote() {
    setStatus("saving");
    setErrorMessage("");
    const { error } = await supabase.from("votes").insert({
      candidate_id: candidateId,
      fingerprint_hash: getFingerprint(),
    });

    if (error) {
      setStatus("error");
      setErrorMessage(
        error.message.includes("duplicate")
          ? "Already voted from this device."
          : error.message
      );
      return;
    }

    setStatus("idle");
    setHasVoted(true);
    setCount((c) => c + 1);
  }

  if (hasVoted === undefined) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={vote}
        disabled={hasVoted || status === "saving"}
        className="font-mono text-xs disabled:opacity-50"
      >
        {hasVoted ? "♥ VOTED" : "♡ HYPE"}
      </button>
      <span className="font-mono text-xs text-mute">{count}</span>
      {status === "error" && (
        <span className="text-xs text-ember">{errorMessage}</span>
      )}
    </div>
  );
}