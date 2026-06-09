"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import VenueCard from "@components/venues/VenueCard";

const LIMIT = 10;

type VenueListItem = {
  id: string;
  name: string;
  category: string;
  city: string;
  photos: string[];
  avgAccessibilityScore: number;
  avgServiceScore: number;
  avgEnvironmentScore: number;
  totalRatings: number;
};

type VenuesResponse = {
  venues: VenueListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function VenuesList() {
  const searchParams = useSearchParams();
  const pageParam = parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const [data, setData] = useState<VenuesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchVenues() {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/venues?page=${page}&limit=${LIMIT}`);
        if (!res.ok) throw new Error("Failed to fetch venues");
        const json: VenuesResponse = await res.json();
        if (active) setData(json);
      } catch (err) {
        console.error(err);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchVenues();
    return () => {
      active = false;
    };
  }, [page]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-sm text-neutral-500">Loading venues...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-sm text-red-600">
          Something went wrong while loading venues. Please try again.
        </div>
      </div>
    );
  }

  if (!data || data.venues.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-sm text-neutral-500">No venues found.</div>
      </div>
    );
  }

  const { venues, pagination } = data;
  const hasPrev = pagination.page > 1;
  const hasNext = pagination.page < pagination.totalPages;

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {venues.map((venue) => (
          <VenueCard
            key={venue.id}
            name={venue.name}
            category={venue.category}
            city={venue.city}
            photo={venue.photos?.[0]}
            href={`/venues/${venue.id}`}
            scores={{
              accessibility: venue.avgAccessibilityScore,
              service: venue.avgServiceScore,
              environment: venue.avgEnvironmentScore,
            }}
          />
        ))}
      </div>

      {/* Pagination */}
      <nav
        className="mt-10 flex items-center justify-center gap-4"
        aria-label="Pagination"
      >
        {hasPrev ? (
          <Link
            href={`/venues?page=${pagination.page - 1}`}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
          >
            ← Previous
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="cursor-not-allowed rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-400 dark:border-neutral-800"
          >
            ← Previous
          </span>
        )}

        <span className="text-sm text-neutral-500">
          Page {pagination.page} of {pagination.totalPages}
        </span>

        {hasNext ? (
          <Link
            href={`/venues?page=${pagination.page + 1}`}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
          >
            Next →
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="cursor-not-allowed rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-400 dark:border-neutral-800"
          >
            Next →
          </span>
        )}
      </nav>
    </>
  );
}

export default function VenuesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold text-foreground">Venues</h1>
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="text-sm text-neutral-500">Loading...</div>
          </div>
        }
      >
        <VenuesList />
      </Suspense>
    </main>
  );
}
