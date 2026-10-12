export default function DayTabs({ days, activeDay, onSelect }) {
  return (
    <div role="tablist" aria-label="Festival days" className="flex gap-2 overflow-x-auto px-4 pb-1">
      {days.map((day) => {
        const active = day.day_number === activeDay;
        return (
          <button
            key={day.day_number}
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(day.day_number)}
            className={[
              "min-h-12 flex-shrink-0 rounded-xl border px-4 text-left transition-colors",
              active ? "border-forest bg-forest text-white" : "border-line bg-surface text-body hover:bg-hover",
            ].join(" ")}
          >
            <span className="block font-display text-lg font-bold leading-none">Day {day.day_number}</span>
            <span className={`block text-xs ${active ? "text-line" : "text-soft"}`}>{day.label}</span>
          </button>
        );
      })}
    </div>
  );
}
