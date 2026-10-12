export default function LiveBadge({ status }) {
  if (status === "ongoing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-live px-2.5 py-1 text-xs font-bold text-white">
        <span className="h-1.5 w-1.5 rounded-full bg-white animate-live-pulse" />
        LIVE
      </span>
    );
  }
  const label = { completed: "Final", cancelled: "Cancelled" }[status] ?? "Upcoming";
  const tone = status === "completed" ? "bg-forest text-white" : "bg-hover text-soft";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${tone} ${status === "cancelled" ? "line-through" : ""}`}>
      {label}
    </span>
  );
}
