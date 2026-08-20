export default function LiveBadge({ status }) {
  if (status === "ongoing") {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-scoreboard">
        <span className="h-2 w-2 rounded-full bg-scoreboard animate-live-pulse" />
        LIVE
      </span>
    );
  }

  if (status === "completed") {
    return (
      <span className="font-mono text-xs tracking-wide text-mute">DONE</span>
    );
  }

  if (status === "cancelled") {
    return (
      <span className="font-mono text-xs tracking-wide text-mute line-through">
        CANCELLED
      </span>
    );
  }

  return <span className="font-mono text-xs tracking-wide text-mute">UPCOMING</span>;
}
