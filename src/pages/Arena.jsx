import { useMemo, useState } from "react";
import { useTournament } from "../lib/useTournament";
import ScoreboardMatch from "../components/ScoreboardMatch";
import BracketView from "../components/BracketView";
import { Splash, ErrorNote } from "../components/Shell";

export default function Arena() {
  const { loading, error, events, matches, departments } = useTournament();
  const [view, setView] = useState("scoreboard");
  const [pickedEventId, setPickedEventId] = useState(null);

  const bracketEvents = useMemo(() => {
    const ids = new Set(matches.filter((m) => m.round != null).map((m) => m.event_id));
    return events.filter((e) => ids.has(e.id));
  }, [events, matches]);
  const activeEventId = pickedEventId ?? bracketEvents[0]?.id ?? null;

  const scoreboard = useMemo(
    () => matches.filter((m) => m.round == null || m.events?.category === "sports"),
    [matches]
  );
  const bracket = matches.filter((m) => m.event_id === activeEventId);

  if (loading) return <Splash>Loading arena…</Splash>;
  if (error) return <ErrorNote message={error} />;

  const tabs = [["scoreboard", "Live scores"], ["brackets", "Brackets"]];
  return (
    <div className="flex flex-col gap-4 px-4 pb-6">
      <div role="tablist" className="flex gap-1 rounded-2xl bg-hover p-1">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={`min-h-12 flex-1 rounded-xl font-semibold ${view === id ? "bg-forest text-white" : "text-forest"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "scoreboard" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {scoreboard.length === 0 ? (
            <p className="text-sm text-soft">No matches yet.</p>
          ) : (
            scoreboard.map((m) => <ScoreboardMatch key={m.id} match={m} departments={departments} />)
          )}
        </div>
      )}

      {view === "brackets" &&
        (bracketEvents.length === 0 ? (
          <p className="text-sm text-soft">No brackets have been set up yet.</p>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto">
              {bracketEvents.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setPickedEventId(e.id)}
                  aria-pressed={activeEventId === e.id}
                  className={`min-h-11 flex-shrink-0 rounded-full border px-4 text-sm font-semibold ${activeEventId === e.id ? "border-mid bg-hover text-ink" : "border-line bg-surface text-soft"}`}
                >
                  {e.name}
                </button>
              ))}
            </div>
            <BracketView matches={bracket} departments={departments} />
          </>
        ))}
    </div>
  );
}
