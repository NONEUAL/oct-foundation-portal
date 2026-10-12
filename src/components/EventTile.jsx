import LiveBadge from "./LiveBadge";

const CATEGORY_LABEL = {
  sports: "Sports", esports: "E-sports", skills: "Skills", pageant: "Pageant", general: "General",
};

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function EventTile({ event }) {
  const live = event.computed_status === "ongoing";
  return (
    <article
      className={`flex items-center gap-3 rounded-2xl border bg-surface p-3 ${live ? "border-live" : "border-line"}`}
    >
      <time className="w-16 flex-shrink-0 font-display text-lg font-semibold leading-tight text-ink">
        {formatTime(event.start_time)}
      </time>
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-bold leading-snug">{event.name}</h3>
        <p className="mt-0.5 text-sm text-soft">
          {event.venue_name} · {CATEGORY_LABEL[event.category] ?? event.category}
        </p>
      </div>
      <LiveBadge status={event.computed_status} />
    </article>
  );
}
