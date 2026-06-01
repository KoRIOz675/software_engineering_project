import { prisma } from "@/lib/prisma";

type SearchParams = {
  start?: string | string[];
  end?: string | string[];
};

type EventListItem = {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  venue: {
    name: string;
    city: string;
  };
};

function firstParam(param?: string | string[]) {
  return Array.isArray(param) ? param[0] : param;
}

function parseDateTime(input?: string) {
  if (!input) {
    return undefined;
  }

  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatEventDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const start = firstParam(resolvedSearchParams.start);
  const end = firstParam(resolvedSearchParams.end);

  const startDate = parseDateTime(start);
  const endDate = parseDateTime(end);

  const events = (await prisma.event.findMany({
    where: {
      date: {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      },
    },
    include: {
      venue: {
        select: {
          name: true,
          city: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  })) as EventListItem[];

  const hasDateFilter = Boolean(startDate || endDate);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold">Events</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Filter events by date and time to find activities that fit your
          schedule.
        </p>
      </div>

      <form className="grid gap-3 rounded-md border p-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          Start date & time
          <input
            type="datetime-local"
            name="start"
            defaultValue={start}
            className="rounded border px-2 py-1"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          End date & time
          <input
            type="datetime-local"
            name="end"
            defaultValue={end}
            className="rounded border px-2 py-1"
          />
        </label>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded bg-black px-3 py-2 text-sm text-white"
          >
            Apply
          </button>
          <a href="/" className="rounded border px-3 py-2 text-sm">
            Clear
          </a>
        </div>
      </form>

      {events.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-sm text-zinc-600">
          {hasDateFilter
            ? "No events found for the selected date range."
            : "No events available."}
        </p>
      ) : (
        <ul className="grid gap-3">
          {events.map((event: EventListItem) => (
            <li key={event.id} className="rounded-md border p-4">
              <h2 className="text-lg font-medium">{event.title}</h2>
              <p className="mt-1 text-sm text-zinc-600">
                {formatEventDate(event.date)} • {event.venue.name},{" "}
                {event.venue.city}
              </p>
              {event.description ? (
                <p className="mt-2 text-sm text-zinc-700">
                  {event.description}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
