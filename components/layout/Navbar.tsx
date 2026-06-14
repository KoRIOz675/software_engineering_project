"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const role = (session?.user as { role?: string } | undefined)?.role;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="text-xl font-black tracking-tight text-brand">
          OpenPlaces
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-6 sm:flex">
          <Link href="/venues" className="text-sm font-medium text-neutral-600 transition hover:text-brand dark:text-neutral-400">
            Venues
          </Link>
          <Link href="/events" className="text-sm font-medium text-neutral-600 transition hover:text-brand dark:text-neutral-400">
            Events
          </Link>
          {role === "VENUE_OWNER" && (
            <Link href="/venues/manage/create" className="text-sm font-medium text-neutral-600 transition hover:text-brand dark:text-neutral-400">
              Add venue
            </Link>
          )}
          {role === "EVENT_ORGANIZER" && (
            <Link href="/events/manage/create" className="text-sm font-medium text-neutral-600 transition hover:text-brand dark:text-neutral-400">
              Add event
            </Link>
          )}
          {(role === "MODERATOR" || role === "ADMIN") && (
            <Link href="/admin" className="text-sm font-medium text-neutral-600 transition hover:text-brand dark:text-neutral-400">
              Admin
            </Link>
          )}
        </div>

        {/* Auth controls */}
        <div className="hidden items-center gap-3 sm:flex">
          {status === "loading" ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
          ) : session ? (
            <>
              <Link
                href="/profile"
                className="text-sm font-medium text-neutral-600 transition hover:text-brand dark:text-neutral-400"
              >
                {session.user?.name ?? "Profile"}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-brand hover:text-brand dark:border-neutral-700"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-neutral-600 transition hover:text-brand dark:text-neutral-400"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand/90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex flex-col gap-1.5 sm:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span className={`block h-0.5 w-5 bg-foreground transition-transform duration-200 ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-5 bg-foreground transition-opacity duration-200 ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 bg-foreground transition-transform duration-200 ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-neutral-200 bg-white px-4 pb-4 dark:border-neutral-800 dark:bg-neutral-950 sm:hidden">
          <div className="flex flex-col gap-3 pt-3 text-sm font-medium">
            <Link href="/venues" onClick={() => setMenuOpen(false)} className="hover:text-brand">Venues</Link>
            <Link href="/events" onClick={() => setMenuOpen(false)} className="hover:text-brand">Events</Link>
            {role === "VENUE_OWNER" && (
              <Link href="/venues/manage/create" onClick={() => setMenuOpen(false)} className="hover:text-brand">Add venue</Link>
            )}
            {role === "EVENT_ORGANIZER" && (
              <Link href="/events/manage/create" onClick={() => setMenuOpen(false)} className="hover:text-brand">Add event</Link>
            )}
            <div className="flex gap-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
              {session ? (
                <>
                  <Link href="/profile" onClick={() => setMenuOpen(false)} className="hover:text-brand">Profile</Link>
                  <button onClick={() => signOut({ callbackUrl: "/" })} className="text-red-500">Sign out</button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="hover:text-brand">Log in</Link>
                  <Link href="/register" onClick={() => setMenuOpen(false)} className="rounded-lg bg-brand px-3 py-1.5 text-white">Sign up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
