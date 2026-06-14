import Link from "next/link";

type EventCardProps = {
  id: string;
  title: string;
  date: string;
  venueName: string;
  venueCity: string;
  avgAccessibilityScore: number;
  organizerName: string;
  reviewCount: number;
};

function scoreColorClasses(score: number) {
  if (score < 4) return "bg-red-100 text-red-700";
  if (score <= 7) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-700";
}

export default function EventCard({
  id,
  title,
  date,
  venueName,
  venueCity,
  avgAccessibilityScore,
  organizerName,
  reviewCount,
}: EventCardProps) {
  const dateObj = new Date(date);
  const dateLabel = dateObj.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeLabel = dateObj.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link
      href={`/events/${id}`}
      className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-5 transition hover:border-neutral-400 hover:shadow-sm dark:border-neutral-800 dark:hover:border-neutral-600"
    >
      <time
        dateTime={dateObj.toISOString()}
        className="text-xs font-medium uppercase tracking-wide text-neutral-500"
      >
        {dateLabel} · {timeLabel}
      </time>

      <h3 className="text-base font-semibold text-foreground">{title}</h3>

      <p className="text-sm text-neutral-500">
        {venueName} · {venueCity}
      </p>

      <div className="flex items-center gap-3 text-sm">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreColorClasses(avgAccessibilityScore)}`}
        >
          ♿ {avgAccessibilityScore.toFixed(1)}
        </span>
        <span className="text-neutral-400">by {organizerName}</span>
        {reviewCount > 0 && (
          <span className="text-neutral-400">
            {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
          </span>
        )}
      </div>
    </Link>
  );
}
