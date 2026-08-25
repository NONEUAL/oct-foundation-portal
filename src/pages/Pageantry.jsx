import { useEffect, useState } from "react";
import { supabase, getActiveEdition } from "../lib/supabaseClient";
import VoteButton from "../components/VoteButton";

export default function Pageantry() {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [voteCounts, setVoteCounts] = useState({});
  const [departmentLookup, setDepartmentLookup] = useState({});

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setLoading(true);
      setErrorMessage(null);

      const edition = await getActiveEdition();
      if (!edition) {
        if (!isCancelled) {
          setErrorMessage("No active Foundation Week edition is set.");
          setLoading(false);
        }
        return;
      }

      const [candidatesResult, tallyResult, deptsResult] = await Promise.all([
        supabase
          .from("candidates")
          .select("*")
          .eq("edition_id", edition.id),
        supabase.from("candidate_vote_counts").select("*"),
        supabase.from("departments").select("*"),
      ]);

      if (isCancelled) return;

      if (candidatesResult.error) {
        setErrorMessage(candidatesResult.error.message);
        setLoading(false);
        return;
      }

      const tallyLookup = {};
      (tallyResult.data || []).forEach(
        (row) => (tallyLookup[row.candidate_id] = row.vote_count)
      );

      const deptLookup = {};
      (deptsResult.data || []).forEach((d) => (deptLookup[d.id] = d));

      setCandidates(candidatesResult.data || []);
      setVoteCounts(tallyLookup);
      setDepartmentLookup(deptLookup);
      setLoading(false);
    }

    load();
    return () => {
      isCancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="p-8 font-mono text-sm text-mute">Loading…</div>;
  }

  if (errorMessage) {
    return (
      <div className="p-8">
        <p className="font-mono text-sm text-ember">Something's off.</p>
        <p className="mt-2 text-sm text-mute">{errorMessage}</p>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="p-8">
        <p className="text-sm text-mute">
          No MMOCT candidates added for this edition yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {candidates.map((candidate) => (
        <div key={candidate.id} className="border border-line p-4">
          <p className="font-display text-sm">{candidate.name}</p>
          <p className="mt-1 text-xs text-mute">
            {departmentLookup[candidate.department_id]?.name ?? ""}
          </p>
          {candidate.bio && (
            <p className="mt-2 text-xs text-mute">{candidate.bio}</p>
          )}
          <div className="mt-3">
            <VoteButton
              candidateId={candidate.id}
              initialCount={voteCounts[candidate.id] ?? 0}
            />
          </div>
        </div>
      ))}
    </div>
  );
}