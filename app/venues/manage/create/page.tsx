"use client";

import Link from "next/link";
import VenueCreateForm from "@components/venues/VenueCreateForm";

export default function VenueCreatePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <Link
        href="/venues"
        className="mb-6 inline-flex items-center text-sm font-medium text-neutral-500 transition hover:text-foreground"
      >
        ← Back to venues
      </Link>

      <h1 className="mb-8 text-2xl font-bold text-foreground">Create a venue</h1>

      <VenueCreateForm />
    </main>
  );
}
