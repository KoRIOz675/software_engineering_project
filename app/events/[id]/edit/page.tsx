"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import EventEditForm, { type EditableEvent } from "@components/events/EventEditForm";

export default function EventEditPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [event, setEvent] = useState<EditableEvent | null>(null);
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
        if (res.status === 404) { if (active) setNotFound(true); return; }
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (active) setEvent(json);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    if (id) fetchEvent();
    return () => { active = false; };
  }, [id]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex flex-wrap gap-4 text-sm font-medium text-neutral-500">
        <Link href={`/events/${id}`} className="transition hover:text-foreground">← Back to event</Link>
        <Link href="/events" className="transition hover:text-foreground">All events</Link>
      </div>

      <h1 className="mb-8 text-2xl font-bold text-foreground">Edit event</h1>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-sm text-neutral-500">Loading event…</div>
        </div>
      )}

      {!loading && notFound && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
          <h2 className="text-xl font-semibold">Event not found</h2>
          <Link href="/events" className="mt-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800">
            Browse events
          </Link>
        </div>
      )}

      {!loading && error && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-sm text-red-600">Something went wrong while loading this event. Please try again.</p>
        </div>
      )}

      {!loading && event && <EventEditForm event={event} />}
    </main>
  );
}
