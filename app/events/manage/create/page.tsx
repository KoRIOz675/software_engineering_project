"use client";

import Link from "next/link";
import EventCreateForm from "@components/events/EventCreateForm";

export default function EventCreatePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/events"
        className="mb-6 inline-flex items-center text-sm font-medium text-neutral-500 transition hover:text-foreground"
      >
        ← Back to events
      </Link>

      <h1 className="mb-8 text-2xl font-bold text-foreground">Create an event</h1>

      <EventCreateForm />
    </main>
  );
}
