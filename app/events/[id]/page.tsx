"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type EventReview = {
  id: string;
  score: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null };
};

type EventDetail = {
  id: string;
  title: string;
  date: string;
  description: string | null;
  createdAt: string;
  avgScore: number | null;
  venue: {
    id: string;
    name: string;
    city: string;
    address: string;
    category: string;
    avgAccessibilityScore: number;
    avgServiceScore: number;
    avgEnvironmentScore: number;
    totalRatings: number;
  };
  organizer: { id: string; name: string };
  reviews: EventReview[];
};

const CATEGORY_LABELS: Record<string, string> = {
  BAR: "Bar",
  MUSEUM: "Museum",
  PARK: "Park",
};

function scoreColorClasses(score: number) {
  if (score < 4) return "bg-red-100 text-red-700";
  if (score <= 7) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-700";
}

function ScoreChip({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <span className="text-xs text-neutral-500">{label}</span>
      <span className={`w-fit rounded-full px-3 py-1 text-lg font-semibold ${scoreColorClasses(score)}`}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchEvent() {
      setLoading(true);
      setNotFound(false);
      setError(false);
      try {
        const res = await fetch(`/api/events/${id}`);
        if (res.status === 404) {
          if (active) setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch event");
        const json: EventDetail = await res.json();
        if (active) setEvent(json);
      } catch (err) {
        console.error(err);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    if (id) fetchEvent();
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/events"
        className="mb-6 inline-flex items-center text-sm font-medium text-neutral-500 transition hover:text-foreground"
      >
        ← Back to events
      </Link>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-sm text-neutral-500">Loading event...</div>
        </div>
      )}

      {!loading && notFound && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
          <h1 className="text-xl font-semibold">Event not found</h1>
          <p className="text-sm text-neutral-500">
            This event doesn't exist or may have been removed.
          </p>
          <Link
            href="/events"
            className="mt-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
          >
            Browse events
          </Link>
        </div>
      )}

      {!loading && error && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-sm text-red-600">
            Something went wrong while loading this event. Please try again.
          </p>
        </div>
      )}

      {!loading && event && (
        <article className="flex flex-col gap-8">
          {/* Header */}
          <header className="flex flex-col gap-3">
            <time
              dateTime={new Date(event.date).toISOString()}
              className="text-sm font-medium text-neutral-500"
            >
              {new Date(event.date).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              at{" "}
              {new Date(event.date).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>

            <h1 className="text-3xl font-bold text-foreground">{event.title}</h1>

            <p className="text-sm text-neutral-500">
              Organized by{" "}
              <span className="font-medium text-foreground">
                {event.organizer.name}
              </span>
            </p>

            {event.avgScore !== null && (
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${scoreColorClasses(event.avgScore)}`}
                >
                  {event.avgScore.toFixed(1)} / 10
                </span>
                <span className="text-sm text-neutral-500">
                  ({event.reviews.length}{" "}
                  {event.reviews.length === 1 ? "review" : "reviews"})
                </span>
              </div>
            )}
          </header>

          {/* Description */}
          {event.description && (
            <section aria-labelledby="about-heading">
              <h2 id="about-heading" className="mb-2 text-lg font-semibold">
                About
              </h2>
              <p className="leading-7 text-neutral-600 dark:text-neutral-300">
                {event.description}
              </p>
            </section>
          )}

          {/* Venue */}
          <section aria-labelledby="venue-heading">
            <h2 id="venue-heading" className="mb-3 text-lg font-semibold">
              Venue
            </h2>
            <Link
              href={`/venues/${event.venue.id}`}
              className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 transition hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{event.venue.name}</p>
                  <p className="text-sm text-neutral-500">
                    {event.venue.address}, {event.venue.city}
                  </p>
                </div>
                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  {CATEGORY_LABELS[event.venue.category] ?? event.venue.category}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <ScoreChip label="Accessibility" score={event.venue.avgAccessibilityScore} />
                <ScoreChip label="Service" score={event.venue.avgServiceScore} />
                <ScoreChip label="Environment" score={event.venue.avgEnvironmentScore} />
              </div>
            </Link>
          </section>

          {/* Add to Calendar — wired up in #84 */}
          <div>
            <a
              href={`/api/events/${event.id}/ics`}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Add to Calendar
            </a>
          </div>

          {/* Reviews */}
          <section aria-labelledby="reviews-heading">
            <h2 id="reviews-heading" className="mb-3 text-lg font-semibold">
              Reviews
            </h2>

            {event.reviews.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
                <p className="text-sm text-neutral-500">
                  No reviews yet. Be the first to share your experience.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {event.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-foreground">
                        {review.user.name}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreColorClasses(review.score)}`}
                      >
                        {review.score} / 10
                      </span>
                      <time
                        dateTime={review.createdAt}
                        className="ml-auto text-xs text-neutral-400"
                      >
                        {new Date(review.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </time>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-300">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </article>
      )}
    </main>
  );
}
