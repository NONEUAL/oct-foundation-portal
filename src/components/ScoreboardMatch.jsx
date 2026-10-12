import LiveBadge from "./LiveBadge";
import FanPick from "./FanPick";

function Side({ dept, score, won, lost }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${lost ? "opacity-50" : ""}`}>
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="h-3 w-3 flex-shrink-0 rounded-full border border-line" style={{ backgroundColor: dept?.color_hex || "#7aaa80" }} />
        <span className={`truncate font-display text-xl font-bold ${won ? "text-ink" : ""}`}>{dept?.code ?? "TBD"}</span>
        {won && <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-ink">Winner</span>}
      </div>
      <span className="font-display text-3xl font-bold tabular-nums">{score ?? 0}</span>
    </div>
  );
}

export default function ScoreboardMatch({ match, departments }) {
  const a = departments[match.department_a_id];
  const b = departments[match.department_b_id];
  const status = match.computed_status;
  const w = match.winner_department_id;
  return (
    <article className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-semibold text-soft">{match.events?.name}</h3>
        <LiveBadge status={status} />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <Side dept={a} score={match.score_a} won={w && w === a?.id} lost={w && w !== a?.id} />
        <Side dept={b} score={match.score_b} won={w && w === b?.id} lost={w && w !== b?.id} />
      </div>
      {status === "upcoming" && a && b && (
        <div className="mt-3 border-t border-line pt-3">
          <FanPick eventId={match.event_id} matchId={match.id} options={[a, b]} />
        </div>
      )}
    </article>
  );
}
