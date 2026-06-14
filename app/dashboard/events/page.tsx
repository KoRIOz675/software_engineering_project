import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function scoreColorClasses(score: number): string {
  if (score < 4) return "bg-red-100 text-red-700";
  if (score <= 7) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-700";
}

function avgScore(scores: number[]): number | null {
  if (scores.length === 0) return null;
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

export default async function EventDashboardPage() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;

  if (!sessionUser?.id) {
    redirect("/login?callbackUrl=/dashboard/events");
  }

  if (sessionUser.role !== "EVENT_ORGANIZER") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center justify-center gap-3 px-4 py-10 text-center">
        <h1 className="text-xl font-semibold text-foreground">Access denied</h1>
        <p className="text-sm text-neutral-500">
          This dashboard is only available to event organizers.
        </p>
        <Link
          href="/events"
          className="mt-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
        >
          Browse events
        </Link>
      </main>
    );
  }

  const events = await prisma.event.findMany({
    where: { organizerId: sessionUser.id },
    orderBy: { date: "asc" },
    select: {
      id: true,
      title: true,
      date: true,
      venue: { select: { id: true, name: true, city: true } },
      _count: { select: { reviews: true } },
      reviews: { select: { score: true } },
    },
  });

  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.date) >= now);
  const past = events.filter((e) => new Date(e.date) < now);

  const totalReviews = events.reduce((sum, e) => sum + e._count.reviews, 0);
  const allScores = events.flatMap((e) => e.reviews.map((r) => r.score));
  const overallAvg = avgScore(allScores);

  function EventRow({ event }: { event: (typeof events)[number] }) {
    const score = avgScore(event.reviews.map((r) => r.score));
    const dateObj = new Date(event.date);

    return (
      <li className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">{event.title}</h3>
            {score !== null && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreColorClasses(score)}`}>
                {score.toFixed(1)} / 10
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-500">
            <Link href={`/venues/${event.venue.id}`} className="hover:text-foreground hover:underline">
              {event.venue.name}
            </Link>
            {" · "}{event.venue.city}
          </p>
          <p className="text-xs text-neutral-400">
            {dateObj.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            {" at "}
            {dateObj.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            {" · "}
            {event._count.reviews} {event._count.reviews === 1 ? "review" : "reviews"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/events/${event.id}`}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            View
          </Link>
          <Link
            href={`/events/${event.id}/edit`}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Edit
          </Link>
        </div>
      </li>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Event dashboard</h1>
        <Link
          href="/events/manage/create"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90"
        >
          + New event
        </Link>
      </div>

      {/* Summary */}
      <section aria-labelledby="summary-heading" className="mb-10">
        <h2 id="summary-heading" className="sr-only">Summary</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <p className="text-sm text-neutral-500">Total events</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{events.length}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <p className="text-sm text-neutral-500">Upcoming</p>
            <p className="mt-1 text-2xl font-bold text-brand">{upcoming.length}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <p className="text-sm text-neutral-500">Total reviews</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{totalReviews}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <p className="text-sm text-neutral-500">Avg. score</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {overallAvg !== null ? overallAvg.toFixed(1) : "—"}
            </p>
          </div>
        </div>
      </section>

      {/* Upcoming events */}
      <section aria-labelledby="upcoming-heading" className="mb-10">
        <h2 id="upcoming-heading" className="mb-4 text-lg font-semibold text-foreground">
          Upcoming events
        </h2>
        {upcoming.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
            <p className="mb-3 text-sm text-neutral-500">No upcoming events.</p>
            <Link href="/events/manage/create" className="text-sm font-medium text-brand hover:underline">
              Create your first event →
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {upcoming.map((event) => <EventRow key={event.id} event={event} />)}
          </ul>
        )}
      </section>

      {/* Past events */}
      {past.length > 0 && (
        <section aria-labelledby="past-heading">
          <h2 id="past-heading" className="mb-4 text-lg font-semibold text-foreground">
            Past events
          </h2>
          <ul className="flex flex-col gap-4">
            {[...past].reverse().map((event) => <EventRow key={event.id} event={event} />)}
          </ul>
        </section>
      )}
    </main>
  );
}
