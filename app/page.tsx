import { Suspense } from "react";
import Link from "next/link";
import SearchBar from "@components/venues/SearchBar";

const CATEGORIES = [
  { value: "BAR", label: "Bars", emoji: "🍺", description: "Accessible bars and nightlife" },
  { value: "MUSEUM", label: "Museums", emoji: "🏛️", description: "Cultural spaces for everyone" },
  { value: "PARK", label: "Parks", emoji: "🌳", description: "Outdoor spaces and gardens" },
] as const;

const HOW_IT_WORKS = [
  { step: "1", title: "Search", description: "Find venues by city, category, or use your location." },
  { step: "2", title: "Explore", description: "Read accessibility, service and environment scores left by the community." },
  { step: "3", title: "Review", description: "Share your experience to help others find the right place." },
] as const;

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-white px-4 py-20 dark:bg-neutral-950">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 text-center">
          <div className="flex flex-col gap-3">
            <span className="mx-auto rounded-full bg-brand-light px-4 py-1 text-xs font-semibold uppercase tracking-widest text-brand-dark dark:text-brand">
              Community-powered accessibility ratings
            </span>
            <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-6xl">
              Find places that{" "}
              <span className="text-brand">work for everyone</span>
            </h1>
            <p className="text-lg text-neutral-500 dark:text-neutral-400">
              Bars, museums and parks rated by the community for accessibility, service and environment.
            </p>
          </div>

          <div className="w-full rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <Suspense fallback={null}>
              <SearchBar action="/venues" />
            </Suspense>
          </div>

          <Link
            href="/venues"
            className="text-sm font-medium text-neutral-400 underline-offset-4 transition hover:text-brand hover:underline"
          >
            Browse all venues →
          </Link>
        </div>
      </section>

      {/* Category cards */}
      <section className="bg-neutral-50 px-4 py-16 dark:bg-neutral-900">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-2xl font-bold text-foreground">
            Browse by category
          </h2>
          <p className="mb-8 text-center text-sm text-neutral-500">
            Find the type of place you're looking for
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {CATEGORIES.map(({ value, label, emoji, description }) => (
              <Link
                key={value}
                href={`/venues?category=${value}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-6 text-center transition hover:border-brand hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-brand"
              >
                <span className="text-4xl">{emoji}</span>
                <div>
                  <p className="font-bold text-foreground group-hover:text-brand">{label}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Events CTA */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center gap-6 rounded-2xl bg-brand p-8 text-center sm:flex-row sm:text-left">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">Discover upcoming events</h2>
              <p className="mt-1 text-sm text-white/80">
                Find inclusive events at accessible venues — concerts, exhibitions, guided tours and more.
              </p>
            </div>
            <Link
              href="/events"
              className="shrink-0 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-brand transition hover:bg-neutral-100"
            >
              Browse events →
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-neutral-50 px-4 py-16 dark:bg-neutral-900">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-2xl font-bold text-foreground">
            How it works
          </h2>
          <p className="mb-10 text-center text-sm text-neutral-500">
            Three steps to find or share accessible places
          </p>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map(({ step, title, description }) => (
              <div key={step} className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-lg font-black text-white">
                  {step}
                </div>
                <div>
                  <p className="font-bold text-foreground">{title}</p>
                  <p className="mt-1 text-sm text-neutral-500">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 px-4 py-6 dark:border-neutral-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-sm font-bold text-brand">OpenPlaces</span>
          <span className="text-xs text-neutral-400">by Matrix Green · ISEP 2026</span>
        </div>
      </footer>
    </div>
  );
}
