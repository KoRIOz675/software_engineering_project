"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type VenueOption = {
  id: string;
  name: string;
  city: string;
  avgAccessibilityScore: number;
};

const fieldClasses =
  "w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-brand dark:border-neutral-700";

export default function EventCreateForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  // Venue picker state
  const [venueSearch, setVenueSearch] = useState("");
  const [venueResults, setVenueResults] = useState<VenueOption[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<VenueOption | null>(null);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleVenueSearchChange(value: string) {
    setVenueSearch(value);
    setSelectedVenue(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!value.trim()) {
      setVenueResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/venues?city=${encodeURIComponent(value)}&limit=5&sort=accessibility`
        );
        const json = await res.json();
        setVenueResults(json.venues ?? []);
      } catch {
        setVenueResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  function selectVenue(venue: VenueOption) {
    setSelectedVenue(venue);
    setVenueSearch(venue.name);
    setVenueResults([]);
  }

  function scoreColor(score: number) {
    if (score < 4) return "text-red-600";
    if (score <= 7) return "text-yellow-600";
    return "text-green-600";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !date || !selectedVenue) {
      setError("Title, date and venue are required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          date: new Date(date).toISOString(),
          venueId: selectedVenue.id,
        }),
      });

      if (res.status === 401) throw new Error("You must be logged in.");
      if (res.status === 403) throw new Error("Only event organizers can create events.");

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Failed to create event.");

      router.push(`/events/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-xl border border-neutral-200 p-6 dark:border-neutral-800"
    >
      {error && (
        <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium text-foreground">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className={fieldClasses}
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={fieldClasses}
        />
      </div>

      {/* Date & time */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="date" className="text-sm font-medium text-foreground">
          Date & time <span className="text-red-500">*</span>
        </label>
        <input
          id="date"
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className={fieldClasses}
        />
      </div>

      {/* Venue picker */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="venue-search" className="text-sm font-medium text-foreground">
          Venue <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="venue-search"
            type="text"
            value={venueSearch}
            onChange={(e) => handleVenueSearchChange(e.target.value)}
            placeholder="Search by city…"
            autoComplete="off"
            className={fieldClasses}
          />

          {/* Dropdown results */}
          {(venueResults.length > 0 || searching) && (
            <ul className="absolute z-10 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
              {searching && (
                <li className="px-3 py-2 text-sm text-neutral-400">Searching…</li>
              )}
              {!searching && venueResults.map((venue) => (
                <li key={venue.id}>
                  <button
                    type="button"
                    onClick={() => selectVenue(venue)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <span>
                      <span className="font-medium text-foreground">{venue.name}</span>
                      <span className="ml-1.5 text-neutral-400">{venue.city}</span>
                    </span>
                    <span className={`text-xs font-semibold ${scoreColor(venue.avgAccessibilityScore)}`}>
                      ♿ {venue.avgAccessibilityScore.toFixed(1)}
                    </span>
                  </button>
                </li>
              ))}
              {!searching && venueResults.length === 0 && (
                <li className="px-3 py-2 text-sm text-neutral-400">No venues found.</li>
              )}
            </ul>
          )}
        </div>

        {/* Selected venue confirmation */}
        {selectedVenue && (
          <div className="flex items-center justify-between rounded-lg bg-brand-light px-3 py-2 text-sm dark:bg-brand/10">
            <span className="font-medium text-brand-dark dark:text-brand">
              {selectedVenue.name} · {selectedVenue.city}
            </span>
            <button
              type="button"
              onClick={() => { setSelectedVenue(null); setVenueSearch(""); }}
              className="text-xs text-neutral-500 hover:text-foreground"
            >
              Change
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:opacity-60"
        >
          {saving ? "Creating…" : "Create event"}
        </button>
      </div>
    </form>
  );
}
