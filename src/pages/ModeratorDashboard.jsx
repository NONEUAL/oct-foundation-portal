import { useEffect, useState, useCallback } from "react";
import { supabase, getActiveEdition } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import ScoreEntryForm from "../components/ScoreEntryForm";

export default function ModeratorDashboard() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [departments, setDepartments] = useState([]); // departments this user moderates
  const [matches, setMatches] = useState([]);
  const [departmentLookup, setDepartmentLookup] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    const edition = await getActiveEdition();
    if (!edition) {
      setErrorMessage("No active edition is set right now.");
      setLoading(false);
      return;
    }

    const [modResult, allDeptsResult] = await Promise.all([
      supabase
        .from("moderators")
        .select("department_id, departments(id, code, name)")
        .eq("user_id", user.id)
        .eq("edition_id", edition.id),
      supabase.from("departments").select("id, code, name"),
    ]);

    if (modResult.error) {
      setErrorMessage(modResult.error.message);
      setLoading(false);
      return;
    }

    const myDepartments = (modResult.data || []).map((row) => row.departments);
    setDepartments(myDepartments);

    const lookup = {};
    (allDeptsResult.data || []).forEach((d) => (lookup[d.id] = d));
    setDepartmentLookup(lookup);

    if (myDepartments.length === 0) {
      setMatches([]);
      setLoading(false);
      return;
    }

    const myDeptIds = myDepartments.map((d) => d.id);
    const { data: matchData, error: matchError } = await supabase
      .from("matches")
      .select("*, events(name, start_time, status)")
      .or(
        myDeptIds
          .map((id) => `department_a_id.eq.${id},department_b_id.eq.${id}`)
          .join(",")
      );

    if (matchError) {
      setErrorMessage(matchError.message);
      setLoading(false);
      return;
    }

    setMatches(matchData || []);
    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="p-8 font-mono text-sm text-mute">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-court text-chalk">
      <header className="flex items-center justify-between border-b border-line px-4 py-4">
        <div>
          <p className="font-mono text-xs tracking-wide text-mute">
            MODERATOR DASHBOARD
          </p>
          <p className="mt-1 text-sm text-mute">{user.email}</p>
        </div>
        <button
          onClick={signOut}
          className="font-mono text-xs tracking-wide text-mute hover:text-scoreboard"
        >
          SIGN OUT
        </button>
      </header>

      <main className="p-4">
        {errorMessage && (
          <p className="mb-4 text-sm text-ember">{errorMessage}</p>
        )}

        {departments.length === 0 ? (
          <p className="text-sm text-mute">
            You're not assigned as a moderator for the current edition yet.
            Ask your Super Admin to add you in the{" "}
            <code className="font-mono text-xs">moderators</code> table.
          </p>
        ) : (
          <>
            <p className="mb-4 text-sm text-mute">
              Managing scores for:{" "}
              <span className="text-chalk">
                {departments.map((d) => d.name).join(", ")}
              </span>
            </p>

            <div className="flex flex-col gap-3">
              {matches.length === 0 ? (
                <p className="text-sm text-mute">
                  No matches scheduled for your department yet.
                </p>
              ) : (
                matches.map((match) => (
                  <div
                    key={match.id}
                    className="flex flex-col gap-2 rounded border border-line bg-court-light p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-display text-sm">
                        {match.events?.name}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-mute">
                        {departmentLookup[match.department_a_id]?.code} vs{" "}
                        {departmentLookup[match.department_b_id]?.code}
                      </p>
                    </div>
                    <ScoreEntryForm match={match} onUpdated={load} />
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}