import LiveBadge from "./LiveBadge";

function roundName(round, last) {
  if (round === last) return "Final";
  if (round === last - 1) return "Semifinals";
  if (round === last - 2) return "Quarterfinals";
  return `Round ${round}`;
}

export default function BracketView({ matches, departments }) {
  const rounds = {};
  matches.forEach((m) => (rounds[m.round ?? 1] ||= []).push(m));
  const nums = Object.keys(rounds).map(Number).sort((a, b) => a - b);
  if (nums.length === 0) {
    return <p className="py-8 text-center text-sm text-soft">No bracket set up for this event yet.</p>;
  }
  const last = nums[nums.length - 1];
  return (
    <div className="flex snap-x gap-4 overflow-x-auto pb-4">
      {nums.map((n) => (
        <section key={n} className="flex w-60 flex-shrink-0 snap-start flex-col gap-3" aria-label={roundName(n, last)}>
          <h3 className="font-display text-lg font-bold text-ink">{roundName(n, last)}</h3>
          <div className="flex flex-1 flex-col justify-around gap-3">
            {rounds[n]
              .sort((x, y) => (x.bracket_position ?? 0) - (y.bracket_position ?? 0))
              .map((m) => (
                <div key={m.id} className="rounded-2xl border border-line bg-surface p-3">
                  <div className="mb-1 flex justify-end"><LiveBadge status={m.computed_status} /></div>
                  {[
                    { dept: departments[m.department_a_id], score: m.score_a },
                    { dept: departments[m.department_b_id], score: m.score_b },
                  ].map((side, i) => {
                    const won = m.winner_department_id && side.dept?.id === m.winner_department_id;
                    const lost = m.winner_department_id && !won;
                    return (
                      <div key={i} className={`flex items-center justify-between py-1.5 ${lost ? "text-muted line-through" : ""} ${won ? "font-bold text-ink" : ""}`}>
                        <span className="font-display text-lg">{side.dept?.code ?? "TBD"}</span>
                        <span className="font-display text-xl tabular-nums">{side.score ?? 0}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
