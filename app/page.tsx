import { Suspense } from "react";
import Link from "next/link";
import SearchBar from "@components/venues/SearchBar";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-24 font-sans dark:bg-black">
      <section className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Find accessible venues near you
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            Search bars, museums and parks rated for accessibility, service and
            environment.
          </p>
        </div>

        {/* Hero search — submitting navigates to /venues with the filters. */}
        <div className="w-full rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <Suspense fallback={null}>
            <SearchBar action="/venues" />
          </Suspense>
        </div>

        <Link
          href="/venues"
          className="text-sm font-medium text-neutral-500 underline-offset-4 transition hover:text-foreground hover:underline"
        >
          Or browse all venues →
        </Link>
      </section>
    </div>
  );
}
