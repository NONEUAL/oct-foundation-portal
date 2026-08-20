import LiveBadge from "./LiveBadge";

// Category colors, not venue colors — `venues` has no color column in the
// schema, and category is the more useful visual grouping in a day view
// where multiple venues run in parallel anyway.
const CATEGORY_COLOR = {
  sports: "#FFB703",
  esports: "#7C9EFF",
  skills: "#4ADE80",
  pageant: "#F472B6",
  general: "#8FA0B8",
};

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function EventTile({ event }) {
  const accentColor = CATEGORY_COLOR[event.category] || "#8FA0B8";

  return (
    <div
      className="flex items-center gap-4 border-l-4 bg-court-light px-4 py-3"
      style={{ borderLeftColor: accentColor }}
    >
      <div className="w-16 flex-shrink-0 font-mono text-xs text-mute">
        {formatTime(event.start_time)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-sm tracking-wide">
          {event.name}
        </div>
        <div className="mt-0.5 text-xs text-mute">
          {event.venue_name} · {event.category}
        </div>
      </div>

      <LiveBadge status={event.computed_status} />
    </div>
  );
}
