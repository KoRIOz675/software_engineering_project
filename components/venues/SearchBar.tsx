"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const CATEGORIES = ["BAR", "MUSEUM", "PARK"] as const;

type SearchBarProps = {
  /**
   * Where to send the search. Defaults to "/venues" so it works as a hero
   * search on the home page; the venues page passes "/venues" too.
   */
  action?: string;
};

const inputClasses =
  "rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-foreground dark:border-neutral-700";

export default function SearchBar({ action = "/venues" }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [minScore, setMinScore] = useState(searchParams.get("minScore") ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Preserve non-search params (e.g. limit), but drop stale page/filters.
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.delete("city");
    params.delete("category");
    params.delete("minScore");

    if (city.trim()) params.set("city", city.trim());
    if (category) params.set("category", category);
    if (minScore.trim()) params.set("minScore", minScore.trim());

    const query = params.toString();
    router.push(query ? `${action}?${query}` : action);
  }

  return (
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

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-neutral-500">Category</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClasses}
        >
          <option value="">All</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0) + c.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-neutral-500">Min. accessibility</span>
        <input
          type="number"
          min={0}
          max={10}
          step={0.1}
          value={minScore}
          onChange={(e) => setMinScore(e.target.value)}
          placeholder="0–10"
          className={`${inputClasses} w-full sm:w-32`}
        />
      </label>

      <button
        type="submit"
        className="rounded-lg bg-foreground px-5 py-2 text-sm font-semibold text-background transition hover:bg-foreground/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Search
      </button>
    </form>
  );
}
