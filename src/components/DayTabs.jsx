export default function DayTabs({ days, activeDay, onSelect }) {
  return (
    <div className="flex gap-px overflow-x-auto border-b border-line bg-court-light">
      {days.map((day) => {
        const isActive = day.day_number === activeDay;
        return (
          <button
            key={day.day_number}
            onClick={() => onSelect(day.day_number)}
            className={[
              "flex-shrink-0 px-5 py-3 font-mono text-xs tracking-wide transition-colors",
              isActive
                ? "bg-court text-scoreboard border-b-2 border-scoreboard -mb-px"
                : "text-mute hover:text-chalk",
            ].join(" ")}
          >
            DAY {day.day_number}
            <div className="mt-0.5 font-body text-[13px] normal-case tracking-normal">
              {day.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
