import LiveBadge from "./LiveBadge";

export default function BracketView({ matches, departmentLookup }) {
  const rounds = {};
  matches.forEach((m) => {
    if (!rounds[m.round]) rounds[m.round] = [];
    rounds[m.round].push(m);
  });
  const roundNumbers = Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b);

  if (roundNumbers.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-mute">
        No bracket set up for this event yet.
      </p>
    );
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {roundNumbers.map((roundNum) => (
        <div key={roundNum} className="flex flex-shrink-0 flex-col gap-4">
          <p className="font-mono text-[11px] tracking-wide text-mute">
            {roundNum === roundNumbers[roundNumbers.length - 1]
              ? "FINALS"
              : `ROUND ${roundNum}`}
          </p>
          {rounds[roundNum].map((match) => {
            const deptA = departmentLookup[match.department_a_id];
            const deptB = departmentLookup[match.department_b_id];
            return (
              <div
                key={match.id}
                className="w-48 rounded border border-line bg-court-light p-3"
              >
                <div className="mb-1 flex justify-end">
                  <LiveBadge status={match.status} />
                </div>
                {[
                  { dept: deptA, score: match.score_a },
                  { dept: deptB, score: match.score_b },
                ].map((side, i) => {
                  const isWinner =
                    match.winner_department_id &&
                    side.dept?.id === match.winner_department_id;
                  return (
                    <div
                      key={i}
                      className={[
                        "flex items-center justify-between py-1 text-sm",
                        isWinner ? "text-scoreboard" : "text-chalk",
                        match.winner_department_id && !isWinner
                          ? "text-mute line-through"
                          : "",
                      ].join(" ")}
                    >
                      <span className="font-mono text-xs">
                        {side.dept?.code ?? "TBD"}
                      </span>
                      <span className="font-display tabular-nums">
                        {side.score}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}