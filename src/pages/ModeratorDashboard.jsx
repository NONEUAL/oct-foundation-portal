import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { useTournament } from "../lib/useTournament";
import ScoreEntryForm from "../components/ScoreEntryForm";
import WinnerPicker from "../components/WinnerPicker";
import LiveBadge from "../components/LiveBadge";
import { Brand, HeaderBar, Splash, ErrorNote } from "../components/Shell";

export default function ModeratorDashboard() {
  const { user, signOut, isAdmin, moderatorDepartments, canDeclareWinners } = useAuth();
  const { loading, error, matches, departments, reload } = useTournament();

  const myIds = useMemo(() => new Set(moderatorDepartments.map((d) => d.id)), [moderatorDepartments]);
  const mine = useMemo(
    () => matches.filter((m) => myIds.has(m.department_a_id) || myIds.has(m.department_b_id)),
    [matches, myIds]
  );

  return (
    <div className="min-h-screen bg-mint">
      <HeaderBar>
        <div className="min-w-0">
          <Brand subtitle={user.email} />
        </div>
        <div className="flex gap-2">
          {isAdmin && <Link to="/admin" className="flex min-h-11 items-center rounded-xl bg-gold px-4 text-sm font-bold text-ink">Admin</Link>}
          <button onClick={signOut} className="min-h-11 rounded-xl border border-line/50 px-4 text-sm font-semibold text-white hover:bg-white/10">Sign out</button>
        </div>
      </HeaderBar>

      <main className="mx-auto max-w-3xl px-4 py-5">
        {loading ? <Splash>Loading…</Splash> : error ? <ErrorNote message={error} /> : moderatorDepartments.length === 0 ? (
          <p className="text-sm text-soft">
            You're not assigned to a department for this edition yet. Ask an admin to invite this email as a moderator.
          </p>
        ) : (
          <>
            <p className="mb-1 text-sm text-soft">Managing</p>
            <h1 className="font-display text-3xl font-bold text-ink">{moderatorDepartments.map((d) => d.code).join(", ")}</h1>
            {!canDeclareWinners && <p className="mt-1 text-sm text-soft">You can enter scores. An admin has not given you permission to declare winners.</p>}

            <div className="mt-4 flex flex-col gap-3">
              {mine.length === 0 && <p className="text-sm text-soft">No matches for your department yet.</p>}
              {mine.map((m) => (
                <article key={m.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h2 className="font-bold">{m.events?.name}</h2>
                      <p className="text-sm text-soft">{departments[m.department_a_id]?.code ?? "TBD"} vs {departments[m.department_b_id]?.code ?? "TBD"}</p>
                    </div>
                    <LiveBadge status={m.computed_status} />
                  </div>
                  <ScoreEntryForm match={m} onUpdated={reload} />
                  {canDeclareWinners && (
                    <div className="border-t border-line pt-3">
                      <WinnerPicker match={m} departments={departments} isAdmin={false} onDone={reload} />
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
