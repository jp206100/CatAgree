"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DeleteWorkshopDialog({
  open,
  onOpenChange,
  workshopId,
  workshopName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workshopId: Id<"workshops">;
  workshopName: string;
}) {
  const softDelete = useMutation(api.workshops.softDelete);
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await softDelete({ id: workshopId });
      onOpenChange(false);
      router.push("/dashboard");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0 text-red-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.75 1A2.75 2.75 0 006 3.75H3.5a.75.75 0 000 1.5h.056l.67 10.04A2.75 2.75 0 006.97 18h6.06a2.75 2.75 0 002.744-2.71l.67-10.04h.056a.75.75 0 000-1.5H14a2.75 2.75 0 00-2.75-2.75h-2.5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <DialogTitle>Delete workshop?</DialogTitle>
              <DialogDescription className="mt-0.5">
                Soft delete — recoverable from the database, but participants
                lose access immediately.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-gray-700">
            Delete <span className="font-medium">{workshopName}</span>?
          </p>
          <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
            <li>
              The workshop disappears from your dashboard (toggle &ldquo;Show
              deleted&rdquo; to see it).
            </li>
            <li>
              Participant magic links resolve to a &ldquo;workshop has
              ended&rdquo; page.
            </li>
            <li>No further emails go out.</li>
          </ul>

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
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete workshop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
