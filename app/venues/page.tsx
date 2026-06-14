"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import VenueCard from "@components/venues/VenueCard";
import SearchBar from "@components/venues/SearchBar";
import FilterPanel from "@components/venues/FilterPanel";

const LIMIT = 10;

// Filter params forwarded to the API.
const FILTER_KEYS = ["city", "category", "minScore", "lat", "lng", "radius", "sort"] as const;

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

  // Re-fetch whenever any param (filters or page) changes.
  const queryString = searchParams.toString();

  const [data, setData] = useState<VenuesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchVenues() {
      setLoading(true);
      setError(null);

      const apiParams = new URLSearchParams();
      for (const key of FILTER_KEYS) {
        const value = searchParams.get(key);
        if (value) apiParams.set(key, value);
      }
      apiParams.set("page", String(page));
      apiParams.set("limit", String(LIMIT));

      try {
        const res = await fetch(`/api/venues?${apiParams.toString()}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.message ?? "Failed to fetch venues");
        }
        if (active) setData(json as VenuesResponse);
      } catch (err) {
        console.error(err);
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to fetch venues");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchVenues();
    return () => {
      active = false;
    };
  }, [queryString, page, searchParams]);

  // Build a pagination link that preserves the active filters.
  function pageHref(targetPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(targetPage));
    return `/venues?${params.toString()}`;
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
        <p className="text-sm text-neutral-500">Loading venues…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-dashed border-red-200 p-12 text-center dark:border-red-900">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!data || data.venues.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
        <p className="text-sm text-neutral-500">No venues found.</p>
      </div>
    );
  }

  const { venues, pagination } = data;
  const hasPrev = pagination.page > 1;
  const hasNext = pagination.page < pagination.totalPages;

  return (
    <>
      <p className="mb-4 text-sm text-neutral-500">
        {pagination.total} {pagination.total === 1 ? "venue" : "venues"} found
      </p>

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
            href={pageHref(pagination.page - 1)}
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
            href={pageHref(pagination.page + 1)}
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
    <main className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold text-foreground">Venues</h1>
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="text-sm text-neutral-500">Loading...</div>
          </div>
        }
      >
        <div className="mb-6 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <SearchBar action="/venues" />
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <FilterPanel />
          <div className="min-w-0 flex-1">
            <VenuesList />
          </div>
        </div>
      </Suspense>
    </main>
  );
}
