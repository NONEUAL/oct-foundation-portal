export default function VenueFilter({ venues, activeVenueId, onSelect }) {
  const chips = [{ id: null, name: "All venues" }, ...venues];
  return (
    <div className="flex gap-2 overflow-x-auto px-4" role="group" aria-label="Filter by venue">
      {chips.map((v) => {
        const active = (v.id ?? null) === (activeVenueId ?? null);
        return (
          <button
            key={v.id ?? "all"}
            aria-pressed={active}
            onClick={() => onSelect(v.id)}
            className={[
              "min-h-11 flex-shrink-0 rounded-full border px-4 text-sm font-semibold",
              active ? "border-mid bg-hover text-ink" : "border-line bg-surface text-soft hover:bg-hover",
            ].join(" ")}
          >
            {v.name}
          </button>
        );
      })}
    </div>
  );
}
