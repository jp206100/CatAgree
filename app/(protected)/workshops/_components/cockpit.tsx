"use client";

import { useAction, useQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { DeleteWorkshopDialog } from "./delete-dialog";

type CockpitParticipant = Doc<"participants"> & {
  latestInvite: Doc<"emailLog"> | null;
};

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function Cockpit({ workshopId }: { workshopId: Id<"workshops"> }) {
  const data = useQuery(api.workshops.getCockpit, { id: workshopId });
  const retry = useAction(api.workshops.retryInvite);
  const [retrying, setRetrying] = useState<Set<Id<"participants">>>(new Set());
  const [retryError, setRetryError] = useState<string | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  if (data === undefined) {
    return (
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-12 text-center text-sm text-gray-400">
          Loading workshop…
        </div>
      </main>
    );
  }
  if (data === null) return null;

  const w = data.workshop;
  const participants = data.participants;

  const sentCount = participants.filter(
    (p) => p.latestInvite?.status === "sent",
  ).length;
  const failedCount = participants.filter(
    (p) => p.latestInvite?.status === "failed",
  ).length;
  const pendingCount = participants.filter((p) => !p.latestInvite).length;

  async function handleRetry(p: CockpitParticipant) {
    if (retrying.has(p._id)) return;
    setRetrying((prev) => new Set(prev).add(p._id));
    setRetryError(null);
    try {
      const result = await retry({ participantId: p._id });
      if (!result.ok && result.error) {
        setRetryError(`${p.email}: ${result.error}`);
      }
    } catch (e: unknown) {
      setRetryError(e instanceof Error ? e.message : "Retry failed");
    } finally {
      setRetrying((prev) => {
        const next = new Set(prev);
        next.delete(p._id);
        return next;
      });
    }
  }

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
            clipRule="evenodd"
          />
        </svg>
        Back to dashboard
      </Link>

      {/* Workshop header */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-semibold text-gray-900 truncate">
                {w.name}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Phase 1 active
              </span>
            </div>
            {w.description && (
              <p className="text-sm text-gray-500 mt-1.5">{w.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 flex-wrap">
              {w.launchedAt && (
                <span>Launched {formatDate(w.launchedAt)}</span>
              )}
              <span className="text-gray-300">·</span>
              <span>
                {participants.length} participant
                {participants.length === 1 ? "" : "s"}
              </span>
              {w.phaseDeadlines.phase1 && (
                <>
                  <span className="text-gray-300">·</span>
                  <span>
                    Phase 1 closes{" "}
                    <span className="text-gray-700 font-medium">
                      {formatDate(w.phaseDeadlines.phase1)}
                    </span>
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Workshop actions"
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 w-56 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-20">
                <Link
                  href={`/workshops/${workshopId}/edit`}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Edit workshop
                </Link>
                <div className="border-t border-gray-100 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setDeleteOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete workshop…
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* M3 notice */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-primary shrink-0 mt-0.5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm0 8a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900">
            Phase 1 is collecting contributions
          </div>
          <div className="text-xs text-gray-600 mt-0.5">
            Participants will use their invite links to contribute cards. The
            contribution editor ships in M3.
          </div>
        </div>
      </div>

      {retryError && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5 text-sm text-red-700">
          {retryError}
        </div>
      )}

      {/* Participants */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-5">
        <div className="px-6 py-4 border-b border-gray-100 flex items-baseline justify-between gap-4 flex-wrap">
          <div className="flex items-baseline gap-3">
            <h2 className="text-sm font-semibold text-gray-900">
              Participants
            </h2>
            <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {sentCount} sent
              </span>
              <span className="text-gray-300">·</span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {failedCount} failed
              </span>
              {pendingCount > 0 && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    {pendingCount} pending
                  </span>
                </>
              )}
            </div>
          </div>
          <Link
            href={`/workshops/${workshopId}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add participant
          </Link>
        </div>

        <div className="grid grid-cols-[2fr_1.5fr_1fr_180px] gap-3 px-6 py-2 bg-gray-50 border-b border-gray-100 text-[11px] font-medium text-gray-500 uppercase tracking-wide">
          <div>Email</div>
          <div>Name</div>
          <div>Role</div>
          <div>Invite status</div>
        </div>

        {participants.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">
            No participants yet.
          </div>
        ) : (
          participants.map((p) => (
            <ParticipantRow
              key={p._id}
              participant={p}
              retrying={retrying.has(p._id)}
              onRetry={() => handleRetry(p)}
            />
          ))
        )}
      </section>

      <section className="bg-white border border-dashed border-gray-200 rounded-2xl p-6 text-center">
        <p className="text-xs text-gray-400 italic">
          Participant progress and contributed cards will appear here in M3.
        </p>
      </section>

      <DeleteWorkshopDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        workshopId={workshopId}
        workshopName={w.name}
      />
    </main>
  );
}

function ParticipantRow({
  participant: p,
  retrying,
  onRetry,
}: {
  participant: CockpitParticipant;
  retrying: boolean;
  onRetry: () => void;
}) {
  const status = p.latestInvite?.status;
  const isFailed = status === "failed";
  const errorMessage = p.latestInvite?.errorMessage ?? null;

  return (
    <>
      <div
        className={`grid grid-cols-[2fr_1.5fr_1fr_180px] gap-3 px-6 py-3 items-center border-b border-gray-100 ${
          isFailed ? "bg-red-50/20" : "hover:bg-gray-50"
        }`}
      >
        <div className="text-sm text-gray-900 truncate">{p.email}</div>
        <div
          className={`text-sm truncate ${
            p.name ? "text-gray-700" : "text-gray-400 italic"
          }`}
        >
          {p.name || "—"}
        </div>
        <div
          className={`text-sm truncate ${
            p.role ? "text-gray-500" : "text-gray-400 italic"
          }`}
        >
          {p.role || "—"}
        </div>
        <div className="flex items-center gap-2">
          {status === "sent" && p.latestInvite && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-medium">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3 h-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
              Sent {formatDate(p.latestInvite.sentAt)}
            </span>
          )}
          {isFailed && (
            <>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 border border-red-100 text-red-700 text-xs font-medium">
                Failed
              </span>
              <button
                type="button"
                onClick={onRetry}
                disabled={retrying}
                className="text-xs text-primary hover:opacity-80 font-medium disabled:opacity-50"
              >
                {retrying ? "Sending…" : "Retry"}
              </button>
            </>
          )}
          {!status && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-600 text-xs font-medium">
              Pending
            </span>
          )}
        </div>
      </div>
      {isFailed && errorMessage && (
        <div className="px-6 py-2.5 bg-red-50/20 border-b border-red-100/60">
          <p className="text-xs text-red-700">
            <span className="font-medium">Delivery failed:</span> {errorMessage}
          </p>
        </div>
      )}
    </>
  );
}
