import { useEffect, useMemo, useState } from "react";
import { supabase, getActiveEdition } from "../lib/supabaseClient";
import ScoreboardMatch from "../components/ScoreboardMatch";
import BracketView from "../components/BracketView";

export default function Arena() {
  const [view, setView] = useState("scoreboard"); // scoreboard | brackets
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [matches, setMatches] = useState([]);
  const [esportsEvents, setEsportsEvents] = useState([]);
  const [activeEventId, setActiveEventId] = useState(null);
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

      const [matchesResult, deptsResult, eventsResult] = await Promise.all([
        supabase
          .from("matches")
          .select("*, events!inner(id, name, category, start_time, edition_id, status)")
          .eq("events.edition_id", edition.id),
        supabase.from("departments").select("*"),
        supabase
          .from("events")
          .select("id, name")
          .eq("edition_id", edition.id)
          .eq("category", "esports"),
      ]);

      if (isCancelled) return;

      if (matchesResult.error) {
        setErrorMessage(matchesResult.error.message);
        setLoading(false);
        return;
      }

      // Compute live status per match the same way the Chronicle view does,
      // since `matches` doesn't carry the live-status view directly.
      const withComputedStatus = (matchesResult.data || []).map((m) => {
        const event = m.events;
        let computed = m.status;
        if (event && m.status !== "cancelled" && m.status !== "completed") {
          const now = new Date();
          const start = new Date(event.start_time);
          computed = now >= start ? "ongoing" : "upcoming";
        }
        return { ...m, events: { ...event, computed_status: computed } };
      });

      const lookup = {};
      (deptsResult.data || []).forEach((d) => (lookup[d.id] = d));

      setMatches(withComputedStatus);
      setDepartmentLookup(lookup);
      setEsportsEvents(eventsResult.data || []);
      if ((eventsResult.data || []).length > 0) {
        setActiveEventId(eventsResult.data[0].id);
      }
      setLoading(false);
    }

    load();
    return () => {
      isCancelled = true;
    };
  }, []);

  const sportsMatches = useMemo(
    () => matches.filter((m) => m.events?.category === "sports"),
    [matches]
  );

  const bracketMatches = useMemo(
    () =>
      matches
        .filter((m) => m.events?.id === activeEventId)
        .sort((a, b) => a.round - b.round),
    [matches, activeEventId]
  );

  if (loading) {
    return <div className="p-8 font-mono text-sm text-mute">Loading arena…</div>;
  }

  if (errorMessage) {
    return (
      <div className="p-8">
        <p className="font-mono text-sm text-scoreboard">Something's off.</p>
        <p className="mt-2 text-sm text-mute">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex gap-4 border-b border-line pb-3">
        <button
          onClick={() => setView("scoreboard")}
          className={[
            "font-mono text-xs tracking-wide",
            view === "scoreboard" ? "text-scoreboard" : "text-mute",
          ].join(" ")}
        >
          LIVE SCOREBOARD
        </button>
        <button
          onClick={() => setView("brackets")}
          className={[
            "font-mono text-xs tracking-wide",
            view === "brackets" ? "text-scoreboard" : "text-mute",
          ].join(" ")}
        >
          BRACKETS
        </button>
      </div>

      {view === "scoreboard" && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sportsMatches.length === 0 ? (
            <p className="text-sm text-mute">No sports matches yet.</p>
          ) : (
            sportsMatches.map((match) => (
              <ScoreboardMatch
                key={match.id}
                match={match}
                departmentLookup={departmentLookup}
              />
            ))
          )}
        </div>
      )}

      {view === "brackets" && (
        <div className="mt-4">
          {esportsEvents.length === 0 ? (
            <p className="text-sm text-mute">No e-sports brackets set up yet.</p>
          ) : (
            <>
              <div className="mb-4 flex gap-2">
                {esportsEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => setActiveEventId(event.id)}
                    className={[
                      "rounded border px-3 py-1.5 font-mono text-xs",
                      activeEventId === event.id
                        ? "border-scoreboard text-scoreboard"
                        : "border-line text-mute",
                    ].join(" ")}
                  >
                    {event.name}
                  </button>
                ))}
              </div>
              <BracketView
                matches={bracketMatches}
                departmentLookup={departmentLookup}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}