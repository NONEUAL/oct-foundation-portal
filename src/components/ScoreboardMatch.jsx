import LiveBadge from "./LiveBadge";
import PredictionButton from "./PredictionButton";

export default function ScoreboardMatch({ match, departmentLookup }) {
  const deptA = departmentLookup[match.department_a_id];
  const deptB = departmentLookup[match.department_b_id];
  const status = match.events?.computed_status ?? match.status;

  return (
    <div className="rounded border border-line bg-court-light p-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] tracking-wide text-mute">
          {match.events?.name}
        </p>
        <LiveBadge status={status} />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: deptA?.color_hex || "#8FA0B8" }}
          />
          <span className="font-display text-sm">{deptA?.code ?? "TBD"}</span>
        </div>
        <span className="font-display text-2xl tabular-nums">
          {match.score_a}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: deptB?.color_hex || "#8FA0B8" }}
          />
          <span className="font-display text-sm">{deptB?.code ?? "TBD"}</span>
        </div>
        <span className="font-display text-2xl tabular-nums">
          {match.score_b}
        </span>
      </div>

      {status === "upcoming" && (
        <div className="mt-4 border-t border-line pt-3">
          <PredictionButton match={match} departmentA={deptA} departmentB={deptB} />
        </div>
      )}
    </div>
  );
}