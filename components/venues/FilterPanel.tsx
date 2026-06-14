"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "BAR", label: "Bar" },
  { value: "MUSEUM", label: "Museum" },
  { value: "PARK", label: "Park" },
] as const;

const SORT_OPTIONS = [
  { value: "", label: "Newest" },
  { value: "accessibility", label: "Best accessibility" },
  { value: "service", label: "Best service" },
  { value: "environment", label: "Best environment" },
] as const;

export default function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const currentCategory = searchParams.get("category") ?? "";
  const currentSort = searchParams.get("sort") ?? "";
  const currentMinScore = Number(searchParams.get("minScore") ?? "0");
  const [sliderValue, setSliderValue] = useState(currentMinScore);

  const activeCount = [
    currentCategory !== "",
    currentSort !== "",
    currentMinScore > 0,
  ].filter(Boolean).length;

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/venues?${params.toString()}`);
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("minScore");
    params.delete("sort");
    params.delete("page");
    setSliderValue(0);
    router.push(`/venues?${params.toString()}`);
  }

  const labelClass = "flex cursor-pointer items-center gap-2 text-sm text-foreground";
  const selectClass =
    "w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground dark:border-neutral-700";

  return (
    <aside className="w-full shrink-0 sm:w-52">
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium sm:hidden dark:border-neutral-800"
      >
        <span>Filters{activeCount > 0 ? ` (${activeCount})` : ""}</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>

      <div className={`${open ? "mt-3 flex" : "hidden"} flex-col gap-6 sm:flex`}>
        {/* Category */}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Category
          </h3>
          <div className="flex flex-col gap-1.5">
            {CATEGORIES.map(({ value, label }) => (
              <label key={label} className={labelClass}>
                <input
                  type="radio"
                  name="category"
                  value={value}
                  checked={currentCategory === value}
                  onChange={() => updateParam("category", value)}
                  className="accent-foreground"
                />
                {label}
              </label>
            ))}
          </div>
        </section>

        {/* Min accessibility score */}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Min. accessibility
          </h3>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">{sliderValue.toFixed(1)} / 10</span>
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={sliderValue}
              onChange={(e) => setSliderValue(Number(e.target.value))}
              onPointerUp={(e) => {
                const val = (e.target as HTMLInputElement).value;
                updateParam("minScore", val === "0" ? "" : val);
              }}
              className="w-full accent-foreground"
            />
            <div className="flex justify-between text-xs text-neutral-400">
              <span>0</span>
              <span>10</span>
            </div>
          </div>
        </section>

        {/* Sort */}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Sort by
          </h3>
          <select
            value={currentSort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className={selectClass}
          >
            {SORT_OPTIONS.map(({ value, label }) => (
              <option key={label} value={value}>
                {label}
              </option>
            ))}
          </select>
        </section>

        {/* Clear */}
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="text-left text-xs text-neutral-400 underline underline-offset-2 hover:text-foreground"
          >
            Clear filters
          </button>
        )}
      </div>
    </aside>
  );
}
