"use client";

import { useAction } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function LaunchDialog({
  open,
  onOpenChange,
  workshopId,
  workshopName,
  participantCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workshopId: Id<"workshops">;
  workshopName: string;
  participantCount: number;
}) {
  const launch = useAction(api.workshops.launch);
  const router = useRouter();
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiry] = useState(() =>
    new Date(Date.now() + THIRTY_DAYS_MS).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
  );

  async function handleLaunch() {
    if (launching) return;
    setLaunching(true);
    setError(null);
    try {
      const result = await launch({ id: workshopId });
      onOpenChange(false);
      router.push(`/workshops/${workshopId}`);
      router.refresh();
      if (result.failed > 0) {
        // Surface as a console hint; cockpit row state shows the detail.
        console.warn(
          `Launched, but ${result.failed} invite${
            result.failed === 1 ? "" : "s"
          } failed. See the cockpit to retry.`,
        );
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Launch failed");
      setLaunching(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M3.105 2.288a.75.75 0 00-.998.928l1.942 5.018a.75.75 0 00.596.474l6.345.63c.335.032.335.514 0 .546l-6.345.63a.75.75 0 00-.596.474l-1.942 5.018a.75.75 0 00.998.928l14-5.25a.75.75 0 000-1.4l-14-5.25z" />
              </svg>
            </div>
            <div className="flex-1">
              <DialogTitle>Launch workshop?</DialogTitle>
              <DialogDescription className="mt-0.5">
                This sends invite emails immediately and starts Phase 1.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 border border-gray-100 rounded-lg divide-y divide-gray-100">
            <Row label="Workshop" value={workshopName} />
            <Row
              label="Participants"
              value={`${participantCount} invite${
                participantCount === 1 ? "" : "s"
              }`}
            />
            <Row label="Sender" value="onboarding@resend.dev" mono />
            <Row label="Links expire" value={`${expiry} (30 days)`} />
          </div>

          <div className="flex gap-2 items-start text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-3 py-2.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 2a1 1 0 00-1 1v3a1 1 0 001 1h.01a1 1 0 100-2H10V9a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              Using Resend&apos;s shared sender while a custom domain is being
              verified. Some inboxes may route these to Promotions or Spam.
            </span>
          </div>

          <p className="text-xs text-gray-500">
            You can still add participants and edit future phase templates after
            launching. The anonymity setting and the invite template become
            locked.
          </p>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={launching}
          >
            Cancel
          </Button>
          <Button onClick={handleLaunch} disabled={launching}>
            {launching ? "Launching…" : "Launch & send invites"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span
        className={`text-sm font-medium text-gray-900 truncate max-w-[260px] ${
          mono ? "font-mono text-gray-700" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
