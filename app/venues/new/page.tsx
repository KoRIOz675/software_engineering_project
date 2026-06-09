import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import VenueCreateForm from "@components/venues/VenueCreateForm";

export default async function NewVenuePage() {
  const session = await getServerSession(authOptions);

  // `id` and `role` are added to the session in the NextAuth callbacks
  // (see lib/auth.ts) but are not part of the default Session.user type.
  const sessionUser = session?.user as
    | { id?: string; role?: string }
    | undefined;

  // Not authenticated → send to login (same convention as the dashboard).
  if (!sessionUser?.id) {
    redirect("/login?callbackUrl=/venues/new");
  }

  // Authenticated but wrong role → access denied state.
  if (sessionUser.role !== "VENUE_OWNER") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-3 px-4 py-10 text-center">
        <h1 className="text-xl font-semibold text-foreground">Access denied</h1>
        <p className="text-sm text-neutral-500">
          Only venue owners can create a venue.
        </p>
        <Link
          href="/venues"
          className="mt-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
        >
          Browse venues
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex flex-wrap gap-4 text-sm font-medium text-neutral-500">
        <Link href="/dashboard/venue" className="transition hover:text-foreground">
          ← Back to dashboard
        </Link>
        <Link href="/venues" className="transition hover:text-foreground">
          All venues
        </Link>
      </div>

      <h1 className="mb-8 text-2xl font-bold text-foreground">Create venue</h1>

      <VenueCreateForm />
    </main>
  );
}
