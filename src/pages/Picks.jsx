import { useMemo } from "react";
import { useTournament } from "../lib/useTournament";
import FanPick from "../components/FanPick";
import ScoreboardMatch from "../components/ScoreboardMatch";
import { Splash, ErrorNote } from "../components/Shell";

export default function Picks() {
  const { loading, error, events, matches, departments } = useTournament();

  // One "who do you want to win the whole event?" card per bracketed event.
  const champions = useMemo(() => {
    return events
      .map((e) => {
        const ms = matches.filter((m) => m.event_id === e.id && m.round != null);
        if (ms.length === 0) return null;
        const first = ms.filter((m) => m.round === 1);
        const ids = new Set();
        first.forEach((m) => { if (m.department_a_id) ids.add(m.department_a_id); if (m.department_b_id) ids.add(m.department_b_id); });
        const final = ms.reduce((a, b) => ((b.round ?? 0) > (a.round ?? 0) ? b : a));
        return { event: e, options: [...ids].map((id) => departments[id]).filter(Boolean), done: !!final.winner_department_id };
      })
      .filter((c) => c && !c.done && c.options.length > 1);
  }, [events, matches, departments]);

  const upcoming = matches.filter((m) => m.computed_status === "upcoming" && m.department_a_id && m.department_b_id);

  if (loading) return <Splash>Loading picks…</Splash>;
  if (error) return <ErrorNote message={error} />;

  return (
    <div className="flex flex-col gap-5 px-4 pb-6">
      <div>
        <h2 className="font-display text-3xl font-bold text-ink">Who do you want to win?</h2>
        <p className="mt-1 text-sm text-soft">Pick your favorites and see what everyone else is rooting for. Just for fun: picks never change official results.</p>
      </div>

      {champions.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="font-display text-xl font-bold text-ink">Champion picks</h3>
          <div className="grid gap-3 lg:grid-cols-2">
            {champions.map((c) => (
              <div key={c.event.id} className="rounded-2xl border border-line bg-surface p-4">
                <p className="mb-2 font-bold">{c.event.name}</p>
                <FanPick eventId={c.event.id} options={c.options} label="Who takes the title?" />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h3 className="font-display text-xl font-bold text-ink">Upcoming matches</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-soft">No upcoming matches to pick right now.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((m) => <ScoreboardMatch key={m.id} match={m} departments={departments} />)}
          </div>
        )}
      </section>
    </div>
  );
}
