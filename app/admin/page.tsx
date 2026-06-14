"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const ROLES = ["USER", "VENUE_OWNER", "EVENT_ORGANIZER", "MODERATOR", "ADMIN"] as const;
type UserRole = (typeof ROLES)[number];

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isBanned: boolean;
  createdAt: string;
  _count: { reviews: number; ownedVenues: number; organizedEvents: number };
};

type UsersResponse = {
  users: AdminUser[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

const ROLE_LABELS: Record<UserRole, string> = {
  USER: "User",
  VENUE_OWNER: "Venue owner",
  EVENT_ORGANIZER: "Organizer",
  MODERATOR: "Moderator",
  ADMIN: "Admin",
};

const inputClasses =
  "rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-brand dark:border-neutral-700";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;

  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (q: string, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), ...(q ? { search: q } : {}) });
      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      if (res.ok) setData(json);
    } catch {
      // ignore — table stays stale
    } finally {
      setLoading(false);
    }
  }, []);

  // Auth guard — proxy handles it, but double-check on the client
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && sessionUser?.role !== "ADMIN") router.push("/");
  }, [status, sessionUser, router]);

  useEffect(() => {
    if (status === "authenticated" && sessionUser?.role === "ADMIN") {
      fetchUsers(search, page);
    }
  }, [page, status, sessionUser, fetchUsers, search]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchUsers(value, 1), 350);
  }

  async function patchUser(id: string, body: Record<string, unknown>) {
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setActionError(json?.message ?? "Action failed.");
        return;
      }
      // Optimistically update the row in-place
      setData((prev) =>
        prev
          ? {
              ...prev,
              users: prev.users.map((u) => (u.id === id ? { ...u, ...json } : u)),
            }
          : prev
      );
    } catch {
      setActionError("Network error.");
    }
  }

  async function deleteUser(id: string) {
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setActionError(json?.message ?? "Delete failed.");
        return;
      }
      setData((prev) =>
        prev
          ? { ...prev, users: prev.users.filter((u) => u.id !== id) }
          : prev
      );
      setConfirmDeleteId(null);
    } catch {
      setActionError("Network error.");
    }
  }

  if (status === "loading" || (status === "authenticated" && sessionUser?.role !== "ADMIN")) {
    return null;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold text-foreground">User management</h1>

      {/* Search */}
      <div className="mb-6">
        <input
          type="search"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by name or email…"
          className={`w-full max-w-sm ${inputClasses}`}
        />
      </div>

      {actionError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/50"
        >
          {actionError}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
          <p className="text-sm text-neutral-500">Loading users…</p>
        </div>
      ) : !data || data.users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
          <p className="text-sm text-neutral-500">No users found.</p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-neutral-500">
            {data.pagination.total} {data.pagination.total === 1 ? "user" : "users"}
          </p>

          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Activity</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {data.users.map((user) => {
                  const isSelf = user.id === sessionUser?.id;
                  return (
                    <tr
                      key={user.id}
                      className={`transition hover:bg-neutral-50 dark:hover:bg-neutral-900 ${
                        user.isBanned ? "opacity-60" : ""
                      }`}
                    >
                      {/* Name */}
                      <td className="px-4 py-3 font-medium text-foreground">
                        {user.name}
                        {isSelf && (
                          <span className="ml-1.5 text-xs text-neutral-400">(you)</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-neutral-500">{user.email}</td>

                      {/* Role dropdown */}
                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          disabled={isSelf}
                          onChange={(e) =>
                            patchUser(user.id, { role: e.target.value })
                          }
                          className="rounded-lg border border-neutral-300 bg-transparent px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Ban status */}
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            user.isBanned
                              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                              : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                          }`}
                        >
                          {user.isBanned ? "Banned" : "Active"}
                        </span>
                      </td>

                      {/* Activity */}
                      <td className="px-4 py-3 text-neutral-500">
                        <span title="Reviews">{user._count.reviews} rev</span>
                        {" · "}
                        <span title="Venues">{user._count.ownedVenues} venues</span>
                        {" · "}
                        <span title="Events">{user._count.organizedEvents} events</span>
                      </td>

                      {/* Joined date */}
                      <td className="px-4 py-3 text-neutral-400">
                        {new Date(user.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {!isSelf && (
                            <>
                              <button
                                onClick={() =>
                                  patchUser(user.id, { isBanned: !user.isBanned })
                                }
                                className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                                  user.isBanned
                                    ? "border border-neutral-300 text-foreground hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                                    : "border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/50"
                                }`}
                              >
                                {user.isBanned ? "Unban" : "Ban"}
                              </button>

                              {confirmDeleteId === user.id ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-neutral-500">Sure?</span>
                                  <button
                                    onClick={() => deleteUser(user.id)}
                                    className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-700"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="text-xs text-neutral-400 hover:text-foreground"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteId(user.id)}
                                  className="rounded-lg border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-500 transition hover:border-red-300 hover:text-red-600 dark:border-neutral-700"
                                >
                                  Delete
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <nav className="mt-6 flex items-center justify-center gap-4" aria-label="Pagination">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-800 dark:hover:bg-neutral-800"
              >
                ← Previous
              </button>
              <span className="text-sm text-neutral-500">
                Page {page} of {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.pagination.totalPages}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-800 dark:hover:bg-neutral-800"
              >
                Next →
              </button>
            </nav>
          )}
        </>
      )}
    </main>
  );
}
