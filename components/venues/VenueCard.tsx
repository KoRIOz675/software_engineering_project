import Image from "next/image";
import Link from "next/link";

export type VenueScores = {
  accessibility: number;
  service?: number;
  environment?: number;
};

export type VenueCardProps = {
  name: string;
  category: string;
  city: string;
  scores: VenueScores;
  photo?: string | null;
  href: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  BAR: "Bar",
  MUSEUM: "Museum",
  PARK: "Park",
};

// Color-coded accessibility badge: red < 4, yellow 4–7 (inclusive), green > 7.
function accessibilityBadgeClasses(score: number): string {
  if (score < 4) return "bg-red-100 text-red-700";
  if (score <= 7) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-700";
}

export default function VenueCard({
  name,
  category,
  city,
  scores,
  photo,
  href,
}: VenueCardProps) {
  const categoryLabel = CATEGORY_LABELS[category] ?? category;
  const accessibility = scores.accessibility;

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md focus-visible:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
    >
      <article>
        {/* Photo */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-200 dark:bg-neutral-800">
          {photo ? (
            <Image
              src={photo}
              alt={`Photo of ${name}, a ${categoryLabel.toLowerCase()} in ${city}`}
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-3xl font-bold text-neutral-400"
              aria-hidden="true"
            >
              {name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Accessibility score badge */}
          <span
            className={`absolute right-2 top-2 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${accessibilityBadgeClasses(
              accessibility
            )}`}
            aria-label={`Accessibility score ${accessibility.toFixed(1)} out of 10`}
          >
            ♿ {accessibility.toFixed(1)}
          </span>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-1.5 p-4">
          <span className="w-fit rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            {categoryLabel}
          </span>

          <h3 className="truncate text-base font-semibold text-foreground sm:text-lg">
            {name}
          </h3>

          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {city}
          </p>

          {/* Optional secondary scores */}
          {(scores.service !== undefined || scores.environment !== undefined) && (
            <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
              {scores.service !== undefined && (
                <div className="flex items-center gap-1">
                  <dt>Service</dt>
                  <dd className="font-medium text-foreground">
                    {scores.service.toFixed(1)}
                  </dd>
                </div>
              )}
              {scores.environment !== undefined && (
                <div className="flex items-center gap-1">
                  <dt>Environment</dt>
                  <dd className="font-medium text-foreground">
                    {scores.environment.toFixed(1)}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </article>
    </Link>
  );
}
