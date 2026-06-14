"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import VenueEditForm, { type EditableVenue } from "@components/venues/VenueEditForm";

export default function VenueEditPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [venue, setVenue] = useState<EditableVenue | null>(null);
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
        const json: EditableVenue = await res.json();
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
      <div className="mb-6 flex flex-wrap gap-4 text-sm font-medium text-neutral-500">
        <Link href={`/venues/${id}`} className="transition hover:text-foreground">
          ← Back to venue
        </Link>
        <Link href="/venues" className="transition hover:text-foreground">
          All venues
        </Link>
      </div>

      <h1 className="mb-8 text-2xl font-bold text-foreground">Edit venue</h1>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-sm text-neutral-500">Loading venue...</div>
        </div>
      )}

      {!loading && notFound && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
          <h2 className="text-xl font-semibold text-foreground">
            Venue not found
          </h2>
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

      {!loading && venue && <VenueEditForm venue={venue} />}
    </main>
  );
}
