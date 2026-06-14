import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CATEGORY_LABELS: Record<string, string> = {
  BAR: "Bar",
  MUSEUM: "Museum",
  PARK: "Park",
};

// Same thresholds as VenueCard: red < 4, yellow 4–7 (inclusive), green > 7.
function scoreColorClasses(score: number): string {
  if (score < 4) return "bg-red-100 text-red-700";
  if (score <= 7) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-700";
}

function ScoreBadge({ label, score }: { label: string; score: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
      {label}
      <span
        className={`rounded-full px-2 py-0.5 font-semibold ${scoreColorClasses(
          score
        )}`}
      >
        {score.toFixed(1)}
      </span>
    </span>
  );
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export default async function VenueDashboardPage() {
  const session = await getServerSession(authOptions);

  // `id` and `role` are added to the session in the NextAuth callbacks
  // (see lib/auth.ts) but are not part of the default Session.user type.
  const sessionUser = session?.user as
    | { id?: string; role?: string }
    | undefined;

  // Not authenticated → send to login (same convention as the profile page).
  if (!sessionUser?.id) {
    redirect("/login?callbackUrl=/dashboard/venue");
  }

  // Authenticated but wrong role → access denied state.
  if (sessionUser.role !== "VENUE_OWNER") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center justify-center gap-3 px-4 py-10 text-center">
        <h1 className="text-xl font-semibold text-foreground">Access denied</h1>
        <p className="text-sm text-neutral-500">
          This dashboard is only available to venue owners.
        </p>
        <Link
          href="/venues"
          className="mt-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
        >
          Browse venues
        </Link>
      </main>
    );
  }

  // Owned venues.
  const venues = await prisma.venue.findMany({
    where: { ownerId: sessionUser.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      city: true,
      category: true,
      avgAccessibilityScore: true,
      avgServiceScore: true,
      avgEnvironmentScore: true,
      totalRatings: true,
    },
  });

  const venueIds = venues.map((v) => v.id);

  // Recent reviews across owned venues (empty array if no venues).
  const recentReviews =
    venueIds.length > 0
      ? await prisma.review.findMany({
          where: { venueId: { in: venueIds }, isDeleted: false },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            comment: true,
            createdAt: true,
            user: { select: { name: true } },
            venue: { select: { id: true, name: true } },
          },
        })
      : [];

  // Summary averages across owned venues.
  const summary = {
    count: venues.length,
    accessibility: average(venues.map((v) => v.avgAccessibilityScore)),
    service: average(venues.map((v) => v.avgServiceScore)),
    environment: average(venues.map((v) => v.avgEnvironmentScore)),
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Venue dashboard</h1>
        {/* Venue creation form route does not exist yet — placeholder CTA. */}
        <span
          aria-disabled="true"
          title="Venue creation is not available yet"
          className="cursor-not-allowed rounded-lg bg-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-500 dark:bg-neutral-800"
        >
          + New venue (coming soon)
        </span>
      </div>

      {/* Summary */}
      <section aria-labelledby="summary-heading" className="mb-10">
        <h2 id="summary-heading" className="sr-only">
          Summary
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <p className="text-sm text-neutral-500">Venues</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {summary.count}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <p className="text-sm text-neutral-500">Avg. accessibility</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {summary.accessibility.toFixed(1)}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <p className="text-sm text-neutral-500">Avg. service</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {summary.service.toFixed(1)}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <p className="text-sm text-neutral-500">Avg. environment</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {summary.environment.toFixed(1)}
            </p>
          </div>
        </div>
      </section>

      {/* Owned venues */}
      <section aria-labelledby="venues-heading" className="mb-10">
        <h2
          id="venues-heading"
          className="mb-4 text-lg font-semibold text-foreground"
        >
          Your venues
        </h2>

        {venues.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
            <p className="text-sm text-neutral-500">
              You don’t own any venues yet.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {venues.map((venue) => (
              <li
                key={venue.id}
                className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-base font-semibold text-foreground">
                      {venue.name}
                    </h3>
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                      {CATEGORY_LABELS[venue.category] ?? venue.category}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500">{venue.city}</p>
                  <div className="flex flex-wrap gap-3">
                    <ScoreBadge
                      label="Access."
                      score={venue.avgAccessibilityScore}
                    />
                    <ScoreBadge label="Service" score={venue.avgServiceScore} />
                    <ScoreBadge
                      label="Env."
                      score={venue.avgEnvironmentScore}
                    />
                    <span className="text-xs text-neutral-500">
                      {venue.totalRatings}{" "}
                      {venue.totalRatings === 1 ? "rating" : "ratings"}
                    </span>
                  </div>
                </div>

                {/* Quick links */}
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/venues/${venue.id}`}
                    className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  >
                    View
                  </Link>
                  <Link
                    href={`/venues/${venue.id}/edit`}
                    className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  >
                    Edit
                  </Link>
                  {/* Event creation route does not exist yet — placeholder. */}
                  <span
                    aria-disabled="true"
                    title="Event creation is not available yet"
                    className="cursor-not-allowed rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-400 dark:border-neutral-800"
                  >
                    Create event
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recent reviews */}
      <section aria-labelledby="reviews-heading">
        <h2
          id="reviews-heading"
          className="mb-4 text-lg font-semibold text-foreground"
        >
          Recent reviews
        </h2>

        {recentReviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
            <p className="text-sm text-neutral-500">
              No reviews on your venues yet.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {recentReviews.map((review) => (
              <li
                key={review.id}
                className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
              >
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-foreground">
                    {review.user.name}
                  </span>
                  <Link
                    href={`/venues/${review.venue.id}`}
                    className="text-neutral-500 transition hover:text-foreground"
                  >
                    {review.venue.name}
                  </Link>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  {review.comment}
                </p>
                <p className="mt-2 text-xs text-neutral-400">
                  {new Date(review.createdAt).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
