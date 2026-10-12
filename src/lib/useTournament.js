import { useCallback, useEffect, useState } from "react";
import { supabase, getActiveEdition } from "./supabaseClient";

// Status shown to visitors. Declared winners always win; otherwise we infer
// from the event start time, the same way Chronicle's view does.
export function computeStatus(match) {
  if (match.winner_department_id || match.status === "completed") return "completed";
  if (match.status === "cancelled") return "cancelled";
  const start = match.events?.start_time;
  if (start && new Date() >= new Date(start)) return "ongoing";
  return "upcoming";
}

// Loads the active edition's events, matches and departments in one go.
export function useTournament() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    edition: null,
    events: [],
    matches: [],
    departments: {},
  });

  const reload = useCallback(async () => {
    const edition = await getActiveEdition();
    if (!edition) {
      setState((s) => ({ ...s, loading: false, error: "No active Foundation Week edition is set." }));
      return;
    }
    const [eventsRes, matchesRes, deptsRes] = await Promise.all([
      supabase
        .from("events")
        .select("id, name, category, start_time, venue_id")
        .eq("edition_id", edition.id)
        .order("start_time"),
      supabase
        .from("matches")
        .select("*, events!inner(id, name, category, start_time, edition_id)")
        .eq("events.edition_id", edition.id),
      supabase.from("departments").select("*").order("code"),
    ]);
    const firstError = eventsRes.error || matchesRes.error || deptsRes.error;
    if (firstError) {
      setState((s) => ({ ...s, loading: false, error: firstError.message }));
      return;
    }
    const departments = {};
    (deptsRes.data || []).forEach((d) => (departments[d.id] = d));
    const matches = (matchesRes.data || []).map((m) => ({ ...m, computed_status: computeStatus(m) }));
    setState({ loading: false, error: null, edition, events: eventsRes.data || [], matches, departments });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  return { ...state, reload };
}
