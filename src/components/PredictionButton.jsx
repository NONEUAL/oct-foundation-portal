import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { getFingerprint } from "../lib/fingerprint";

export default function PredictionButton({ match, departmentA, departmentB }) {
  const [myPrediction, setMyPrediction] = useState(undefined); // undefined = checking
  const [status, setStatus] = useState("idle"); // idle | saving | error
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCancelled = false;
    async function checkExisting() {
      const fingerprint = getFingerprint();
      const { data } = await supabase
        .from("predictions")
        .select("predicted_department_id")
        .eq("match_id", match.id)
        .eq("fingerprint_hash", fingerprint)
        .maybeSingle();
      if (!isCancelled) setMyPrediction(data?.predicted_department_id ?? null);
    }
    checkExisting();
    return () => {
      isCancelled = true;
    };
  }, [match.id]);

  async function pick(departmentId) {
    setStatus("saving");
    setErrorMessage("");
    const { error } = await supabase.from("predictions").insert({
      match_id: match.id,
      fingerprint_hash: getFingerprint(),
      predicted_department_id: departmentId,
    });

    if (error) {
      setStatus("error");
      setErrorMessage(
        error.message.includes("policy") || error.code === "42501"
          ? "Predictions close once the match starts."
          : error.message.includes("duplicate")
          ? "You've already picked for this match."
          : error.message
      );
      return;
    }

    setStatus("idle");
    setMyPrediction(departmentId);
  }

  if (myPrediction === undefined) return null; // still checking, avoid a flash

  if (myPrediction) {
    const pickedName =
      myPrediction === departmentA?.id ? departmentA?.code : departmentB?.code;
    return (
      <p className="font-mono text-xs text-scoreboard">
        You picked {pickedName}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-mono text-[11px] tracking-wide text-mute">
        PICK YOUR WINNER
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => pick(departmentA?.id)}
          disabled={status === "saving"}
          className="rounded border border-line px-3 py-1 font-mono text-xs text-chalk hover:border-scoreboard hover:text-scoreboard disabled:opacity-50"
        >
          {departmentA?.code}
        </button>
        <button
          onClick={() => pick(departmentB?.id)}
          disabled={status === "saving"}
          className="rounded border border-line px-3 py-1 font-mono text-xs text-chalk hover:border-scoreboard hover:text-scoreboard disabled:opacity-50"
        >
          {departmentB?.code}
        </button>
      </div>
      {status === "error" && (
        <p className="text-xs text-scoreboard">{errorMessage}</p>
      )}
    </div>
  );
}