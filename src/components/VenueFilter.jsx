export default function VenueFilter({ venues, activeVenueId, onSelect }) {
  return (
    <select
      value={activeVenueId ?? "all"}
      onChange={(e) => onSelect(e.target.value === "all" ? null : e.target.value)}
      className="rounded border border-line bg-court-light px-3 py-2 font-mono text-xs text-chalk focus:outline-none focus:ring-2 focus:ring-scoreboard"
    >
      <option value="all">All venues</option>
      {venues.map((venue) => (
        <option key={venue.id} value={venue.id}>
          {venue.name}
        </option>
      ))}
    </select>
  );
}
