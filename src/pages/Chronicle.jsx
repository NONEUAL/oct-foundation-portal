import { useEffect, useMemo, useState } from "react";
import { supabase, getActiveEdition } from "../lib/supabaseClient";
import DayTabs from "../components/DayTabs";
import VenueFilter from "../components/VenueFilter";
import EventTile from "../components/EventTile";

export default function Chronicle() {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [activeDay, setActiveDay] = useState(1);
  const [activeVenueId, setActiveVenueId] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setLoading(true);
      setErrorMessage(null);

      const edition = await getActiveEdition();
      if (!edition) {
        if (!isCancelled) {
          setErrorMessage(
            "No active Foundation Week edition is set. Flip is_active = true on the current year's row in the editions table."
          );
          setLoading(false);
        }
        return;
      }

      const [eventsResult, venuesResult] = await Promise.all([
        supabase
          .from("events_with_live_status")
          .select("*, venues(name)")
          .eq("edition_id", edition.id)
          .order("start_time", { ascending: true }),
        supabase.from("venues").select("*").order("name"),
      ]);

      if (isCancelled) return;

      if (eventsResult.error) {
        setErrorMessage(eventsResult.error.message);
        setLoading(false);
        return;
      }

      const normalized = (eventsResult.data || []).map((event) => ({
        ...event,
        venue_name: event.venues?.name ?? "TBD",
      }));

      setEvents(normalized);
      setVenues(venuesResult.data || []);
      setLoading(false);
    }

    load();
    return () => {
      isCancelled = true;
    };
  }, []);

  const days = useMemo(() => {
    const dayNumbers = [...new Set(events.map((e) => e.day_number))].sort(
      (a, b) => a - b
    );
    return dayNumbers.map((day_number) => {
      const sample = events.find((e) => e.day_number === day_number);
      const label = sample
        ? new Date(sample.start_time).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })
        : "";
      return { day_number, label };
    });
  }, [events]);

  const visibleEvents = useMemo(() => {
    return events
      .filter((e) => e.day_number === activeDay)
      .filter((e) => !activeVenueId || e.venue_id === activeVenueId);
  }, [events, activeDay, activeVenueId]);

  if (loading) {
    return (
      <div className="p-8 font-mono text-sm text-mute">Loading schedule…</div>
    );
  }

  if (errorMessage) {
    return (
      <div className="p-8">
        <p className="font-mono text-sm text-scoreboard">Something's off.</p>
        <p className="mt-2 text-sm text-mute">{errorMessage}</p>
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div className="p-8">
        <p className="font-display text-lg">No events yet.</p>
        <p className="mt-2 text-sm text-mute">
          Once events are added for the active edition, they'll show up here
          grouped by day.
        </p>
      </div>
    );
  }

  return (
    <div>
      <DayTabs days={days} activeDay={activeDay} onSelect={setActiveDay} />

      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="font-display text-sm tracking-wide text-mute">
          SCHEDULE
        </h2>
        <VenueFilter
          venues={venues}
          activeVenueId={activeVenueId}
          onSelect={setActiveVenueId}
        />
      </div>

      <div className="flex flex-col gap-px px-4 pb-8">
        {visibleEvents.length === 0 ? (
          <p className="py-8 text-center text-sm text-mute">
            Nothing scheduled for this venue on this day.
          </p>
        ) : (
          visibleEvents.map((event) => (
            <EventTile key={event.id} event={event} />
          ))
        )}
      </div>
    </div>
  );
}
