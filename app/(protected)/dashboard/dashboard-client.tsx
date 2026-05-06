"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatDeadline(ms: number | undefined): string {
  if (!ms) return "No deadline";
  return formatDate(ms);
}

function StatusBadge({ status }: { status: "draft" | "phase1_active" | "deleted" }) {
  if (status === "phase1_active") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Phase 1 active
      </span>
    );
  }
  if (status === "deleted") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 border border-red-100 text-red-700 text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Deleted
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-600 text-xs font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Draft
    </span>
  );
}

export function DashboardClient() {
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [search, setSearch] = useState("");
  const workshops = useQuery(api.workshops.listForAdmin, { includeDeleted });

  const filtered = useMemo(() => {
    if (!workshops) return undefined;
    const q = search.trim().toLowerCase();
    if (q.length === 0) return workshops;
    return workshops.filter((w) => w.name.toLowerCase().includes(q));
  }, [workshops, search]);

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Workshops</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your card sorting sessions
          </p>
        </div>
        <Button asChild>
          <Link href="/workshops/new">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            New workshop
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workshops"
            className="pl-9 pr-3 py-2 w-64 rounded-lg border border-gray-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-gray-400"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => setIncludeDeleted(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          Show deleted
        </label>
      </div>

      {filtered === undefined ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-12 text-center text-sm text-gray-400">
          Loading workshops…
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasFilter={search.length > 0 || includeDeleted} />
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {filtered.map((w, i) => (
            <Link
              key={w._id}
              href={`/workshops/${w._id}`}
              className={`block hover:bg-gray-50 transition-colors ${
                w.status === "deleted" ? "opacity-60" : ""
              }`}
            >
              <div
                className={`flex items-center gap-6 px-6 py-4 ${
                  i < filtered.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`font-medium truncate ${
                        w.status === "deleted"
                          ? "text-gray-600 line-through"
                          : "text-gray-900"
                      }`}
                    >
                      {w.name}
                    </span>
                    <StatusBadge status={w.status} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {w.participantCount} participant
                    {w.participantCount === 1 ? "" : "s"}
                    {" · "}
                    {w.launchedAt
                      ? `launched ${formatDate(w.launchedAt)}`
                      : w.deletedAt
                        ? `deleted ${formatDate(w.deletedAt)}`
                        : `created ${formatDate(w.createdAt)}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-gray-400">
                    {w.status === "phase1_active"
                      ? "Phase 1 closes"
                      : w.status === "deleted"
                        ? ""
                        : "Not launched"}
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      w.status === "deleted" ? "text-gray-400" : "text-gray-700"
                    }`}
                  >
                    {w.status === "phase1_active"
                      ? formatDeadline(w.phaseDeadlines.phase1)
                      : "—"}
                  </div>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-gray-300 shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  if (hasFilter) {
    return (
      <div className="bg-white border border-dashed border-gray-200 rounded-2xl py-16 px-8 text-center">
        <p className="text-sm text-gray-500">No workshops match your filters.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center bg-white border border-dashed border-gray-200 rounded-2xl py-20 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-5 text-3xl">
        🃏
      </div>
      <h2 className="text-base font-semibold text-gray-900 mb-1">
        No workshops yet
      </h2>
      <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-6">
        When you create a workshop, it&apos;ll appear here. You&apos;ll invite
        participants, run them through four phases, and export a content map.
      </p>
      <Button asChild>
        <Link href="/workshops/new">+ Create your first workshop</Link>
      </Button>
    </div>
  );
}
