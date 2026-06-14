"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import EventCard from "@components/events/EventCard";

const LIMIT = 10;
const FILTER_KEYS = ["venueId", "dateFrom", "dateTo"] as const;

type EventListItem = {
  id: string;
  title: string;
  date: string;
  description: string | null;
  venue: {
    id: string;
    name: string;
    city: string;
    avgAccessibilityScore: number;
  };
  organizer: { id: string; name: string };
  _count: { reviews: number };
};

type EventsResponse = {
  events: EventListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const inputClasses =
  "rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground dark:border-neutral-700";

function EventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pageParam = parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const queryString = searchParams.toString();

  const [data, setData] = useState<EventsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") ?? "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") ?? "");

  useEffect(() => {
    let active = true;

    async function fetchEvents() {
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
        const res = await fetch(`/api/events?${apiParams.toString()}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message ?? "Failed to fetch events");
        if (active) setData(json as EventsResponse);
      } catch (err) {
        if (active)
          setError(err instanceof Error ? err.message : "Failed to fetch events");
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchEvents();
    return () => {
      active = false;
    };
  }, [queryString, page, searchParams]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (dateFrom) params.set("dateFrom", dateFrom);
    else params.delete("dateFrom");
    if (dateTo) params.set("dateTo", dateTo);
    else params.delete("dateTo");
    router.push(`/events?${params.toString()}`);
  }

  function clearFilters() {
    setDateFrom("");
    setDateTo("");
    router.push("/events");
  }

  function pageHref(targetPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(targetPage));
    return `/events?${params.toString()}`;
  }

  const hasFilters = !!(searchParams.get("dateFrom") || searchParams.get("dateTo"));

  return (
    <>
      {/* Date filter */}
      <form
        onSubmit={applyFilters}
        className="mb-8 flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800 sm:flex-row sm:items-end"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-500">From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={inputClasses}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-500">To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={inputClasses}
          />
        </label>

        <button
          type="submit"
          className="rounded-lg bg-foreground px-5 py-2 text-sm font-semibold text-background transition hover:bg-foreground/80"
        >
          Filter
        </button>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-neutral-400 underline underline-offset-2 hover:text-foreground"
          >
            Clear
          </button>
        )}
      </form>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-sm text-neutral-500">Loading events...</div>
        </div>
      )}

      {!loading && error && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      {!loading && !error && data && data.events.length === 0 && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-neutral-500">No upcoming events found.</p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-sm underline underline-offset-2 hover:text-foreground"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {!loading && !error && data && data.events.length > 0 && (
        <>
          <p className="mb-4 text-sm text-neutral-500">
            {data.pagination.total}{" "}
            {data.pagination.total === 1 ? "event" : "events"} found
          </p>

          <div className="flex flex-col gap-4">
            {data.events.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                date={event.date}
                venueName={event.venue.name}
                venueCity={event.venue.city}
                avgAccessibilityScore={event.venue.avgAccessibilityScore}
                organizerName={event.organizer.name}
                reviewCount={event._count.reviews}
              />
            ))}
          </div>

          <nav
            className="mt-10 flex items-center justify-center gap-4"
            aria-label="Pagination"
          >
            {data.pagination.page > 1 ? (
              <Link
                href={pageHref(data.pagination.page - 1)}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
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
              Page {data.pagination.page} of {data.pagination.totalPages}
            </span>

            {data.pagination.page < data.pagination.totalPages ? (
              <Link
                href={pageHref(data.pagination.page + 1)}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
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
      )}
    </>
  );
}

export default function EventsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold text-foreground">Events</h1>
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="text-sm text-neutral-500">Loading...</div>
          </div>
        }
      >
        <EventsContent />
      </Suspense>
    </main>
  );
}
