"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const DEFAULT_RADIUS = "10";

const inputClasses =
  "rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-foreground dark:border-neutral-700";

type SearchBarProps = {
  action?: string;
};

export default function SearchBar({ action = "/venues" }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const hasGeo = searchParams.has("lat") && searchParams.has("lng");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.delete("city");
    if (city.trim()) params.set("city", city.trim());
    router.push(`${action}?${params.toString()}`);
  }

  function handleNearMe() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoLoading(false);
        const params = new URLSearchParams(searchParams.toString());
        params.delete("page");
        params.set("lat", String(position.coords.latitude));
        params.set("lng", String(position.coords.longitude));
        params.set("radius", DEFAULT_RADIUS);
        router.push(`${action}?${params.toString()}`);
      },
      () => {
        setGeoLoading(false);
        setGeoError("Location access denied. Please enable it in your browser settings.");
      },
      { timeout: 8000 }
    );
  }

  function clearGeo() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("lat");
    params.delete("lng");
    params.delete("radius");
    params.delete("page");
    router.push(`${action}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="Search venues"
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="text-neutral-500">City</span>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Paris"
            className={inputClasses}
          />
        </label>

        <button
          type="submit"
          className="rounded-lg bg-foreground px-5 py-2 text-sm font-semibold text-background transition hover:bg-foreground/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Search
        </button>

        <button
          type="button"
          onClick={handleNearMe}
          disabled={geoLoading}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-neutral-100 disabled:cursor-wait disabled:opacity-60 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          {geoLoading ? "Locating…" : "Near me"}
        </button>
      </form>

      {hasGeo && (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <span>Using your location ({DEFAULT_RADIUS} km)</span>
          <button
            onClick={clearGeo}
            className="text-xs underline underline-offset-2 hover:text-foreground"
          >
            Clear
          </button>
        </div>
      )}

      {geoError && (
        <p className="text-sm text-red-600">{geoError}</p>
      )}
    </div>
  );
}
