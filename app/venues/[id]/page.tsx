"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type VenueDetail = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  lat: number | null;
  lng: number | null;
  category: string;
  photos: string[];
  avgAccessibilityScore: number;
  avgServiceScore: number;
  avgEnvironmentScore: number;
  totalRatings: number;
  createdAt: string;
  updatedAt: string;
};

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

function ScoreBreakdown({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <span className="text-sm text-neutral-500 dark:text-neutral-400">
        {label}
      </span>
      <span
        className={`w-fit rounded-full px-3 py-1 text-lg font-semibold ${scoreColorClasses(
          score
        )}`}
      >
        {score.toFixed(1)}
      </span>
    </div>
  );
}

export default function VenueDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchVenue() {
      setLoading(true);
      setNotFound(false);
      setError(false);
      try {
        const res = await fetch(`/api/venues/${id}`);
        if (res.status === 404) {
          if (active) setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch venue");
        const json: VenueDetail = await res.json();
        if (active) setVenue(json);
      } catch (err) {
        console.error(err);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    if (id) fetchVenue();
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <Link
        href="/venues"
        className="mb-6 inline-flex items-center text-sm font-medium text-neutral-500 transition hover:text-foreground"
      >
        ← Back to venues
      </Link>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-sm text-neutral-500">Loading venue...</div>
        </div>
      )}

      {!loading && notFound && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            Venue not found
          </h1>
          <p className="text-sm text-neutral-500">
            This venue doesn’t exist or may have been removed.
          </p>
          <Link
            href="/venues"
            className="mt-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
          >
            Browse venues
          </Link>
        </div>
      )}

      {!loading && error && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-sm text-red-600">
            Something went wrong while loading this venue. Please try again.
          </div>
        </div>
      )}

      {!loading && venue && (
        <article className="flex flex-col gap-8">
          {/* Hero photo */}
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-neutral-200 dark:bg-neutral-800">
            {venue.photos?.length > 0 ? (
              <Image
                src={venue.photos[0]}
                alt={`Photo of ${venue.name}, a ${(
                  CATEGORY_LABELS[venue.category] ?? venue.category
                ).toLowerCase()} in ${venue.city}`}
                fill
                unoptimized
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-5xl font-bold text-neutral-400"
                aria-hidden="true"
              >
                {venue.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Header: name, category, address */}
          <header className="flex flex-col gap-3">
            <span className="w-fit rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              {CATEGORY_LABELS[venue.category] ?? venue.category}
            </span>
            <h1 className="text-3xl font-bold text-foreground">{venue.name}</h1>
            <p className="text-neutral-500 dark:text-neutral-400">
              {venue.address}, {venue.city}
            </p>
          </header>

          {/* Description */}
          {venue.description && (
            <section aria-labelledby="about-heading">
              <h2
                id="about-heading"
                className="mb-2 text-lg font-semibold text-foreground"
              >
                About
              </h2>
              <p className="leading-7 text-neutral-600 dark:text-neutral-300">
                {venue.description}
              </p>
            </section>
          )}

          {/* Score breakdowns */}
          <section aria-labelledby="scores-heading">
            <div className="mb-3 flex items-baseline justify-between">
              <h2
                id="scores-heading"
                className="text-lg font-semibold text-foreground"
              >
                Scores
              </h2>
              <span className="text-sm text-neutral-500">
                {venue.totalRatings}{" "}
                {venue.totalRatings === 1 ? "rating" : "ratings"}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ScoreBreakdown
                label="Accessibility"
                score={venue.avgAccessibilityScore}
              />
              <ScoreBreakdown label="Service" score={venue.avgServiceScore} />
              <ScoreBreakdown
                label="Environment"
                score={venue.avgEnvironmentScore}
              />
            </div>
          </section>

          {/* Photo gallery (only if more than the hero photo) */}
          {venue.photos?.length > 1 && (
            <section aria-labelledby="gallery-heading">
              <h2
                id="gallery-heading"
                className="mb-3 text-lg font-semibold text-foreground"
              >
                Gallery
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {venue.photos.slice(1).map((photo, index) => (
                  <div
                    key={`${photo}-${index}`}
                    className="relative aspect-square overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-800"
                  >
                    <Image
                      src={photo}
                      alt={`${venue.name} photo ${index + 2}`}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          <section aria-labelledby="reviews-heading">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2
                id="reviews-heading"
                className="text-lg font-semibold text-foreground"
              >
                Reviews
              </h2>
              <button
                type="button"
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:bg-foreground/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Leave a review
              </button>
            </div>

            {/* Reviews are not exposed by the API yet — show an empty state. */}
            <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
              <p className="text-sm text-neutral-500">
                No reviews yet. Be the first to share your experience.
              </p>
            </div>
          </section>
        </article>
      )}
    </main>
  );
}
