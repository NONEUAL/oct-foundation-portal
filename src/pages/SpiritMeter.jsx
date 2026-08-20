import { useEffect, useState } from "react";
import { supabase, getActiveEdition } from "../lib/supabaseClient";

export default function SpiritMeter() {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [rows, setRows] = useState([]); // { department, total_points }

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

      const [leaderboardResult, deptsResult] = await Promise.all([
        supabase
          .from("leaderboard")
          .select("*")
          .eq("edition_id", edition.id)
          .order("total_points", { ascending: false }),
        supabase.from("departments").select("*"),
      ]);

      if (isCancelled) return;

      if (leaderboardResult.error) {
        setErrorMessage(leaderboardResult.error.message);
        setLoading(false);
        return;
      }

      const deptLookup = {};
      (deptsResult.data || []).forEach((d) => (deptLookup[d.id] = d));

      const merged = (leaderboardResult.data || []).map((row) => ({
        ...row,
        department: deptLookup[row.department_id],
      }));

      setRows(merged);
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
        <p className="font-mono text-sm text-scoreboard">Something's off.</p>
        <p className="mt-2 text-sm text-mute">{errorMessage}</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="p-8">
        <p className="text-sm text-mute">
          No points have been awarded yet this edition. Add rows to
          points_ledger to see the leaderboard populate.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div
            key={row.department_id}
            className="flex items-center justify-between border border-line px-4 py-2"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 font-mono text-xs text-mute">
                {i + 1}
              </span>
              <span>{row.department?.name ?? row.department_id}</span>
            </div>
            <span className="font-mono text-sm">{row.total_points} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}