"use client";

import { useAction, useMutation } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  parseBulkParticipants,
  type ParsedParticipant,
} from "@/lib/parse-participants";
import { LaunchDialog } from "./launch-dialog";

const DEFAULT_SUBJECT =
  "You're invited to a card sorting workshop: {{workshopName}}";
const DEFAULT_BODY = `Hi {{participantName}},

You've been invited to take part in a card sorting workshop: {{workshopName}}.

Click the link below to get started. Your link is unique to you and will expire in 30 days.

{{magicLink}}

Thanks!`;

const PREVIEW_TOKEN = "4xR2…9kZq";

type LocalParticipant = {
  serverId?: Id<"participants">;
  localKey: string;
  email: string;
  name: string | null;
  role: string | null;
  // Original server values, used to detect dirty edits.
  originalName?: string | null;
  originalRole?: string | null;
};

type InitialData = {
  workshop: Doc<"workshops">;
  participants: Doc<"participants">[];
};

function nextLocalKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

function ymdFromMs(ms: number | undefined): string {
  if (!ms) return "";
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function msFromYmd(ymd: string): number | undefined {
  if (!ymd) return undefined;
  const t = new Date(ymd + "T00:00:00").getTime();
  return Number.isNaN(t) ? undefined : t;
}

export function WorkshopForm({
  initialData,
}: {
  initialData: InitialData | null;
}) {
  const isNew = !initialData;
  const router = useRouter();

  const w = initialData?.workshop;
  const isActive = w?.status === "phase1_active";
  const isDeleted = w?.status === "deleted";

  const [name, setName] = useState(w?.name ?? "");
  const [description, setDescription] = useState(w?.description ?? "");
  const [anonymityMode, setAnonymityMode] = useState<
    "anonymous" | "attributed"
  >(w?.anonymityMode ?? "anonymous");
  const [subject, setSubject] = useState(
    w?.emailTemplates.invite.subject ?? DEFAULT_SUBJECT,
  );
  const [body, setBody] = useState(
    w?.emailTemplates.invite.body ?? DEFAULT_BODY,
  );
  const [phase1Ymd, setPhase1Ymd] = useState(
    ymdFromMs(w?.phaseDeadlines.phase1),
  );

  const [participants, setParticipants] = useState<LocalParticipant[]>(
    () =>
      initialData?.participants.map((p) => ({
        serverId: p._id,
        localKey: p._id,
        email: p.email,
        name: p.name,
        role: p.role,
        originalName: p.name,
        originalRole: p.role,
      })) ?? [],
  );
  const [removedIds, setRemovedIds] = useState<Set<Id<"participants">>>(
    new Set(),
  );

  const [addEmail, setAddEmail] = useState("");
  const [addName, setAddName] = useState("");
  const [addRole, setAddRole] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [skippedLines, setSkippedLines] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [launchOpen, setLaunchOpen] = useState(false);

  const createWorkshop = useMutation(api.workshops.create);
  const updateWorkshop = useMutation(api.workshops.update);
  const addParticipant = useMutation(api.participants.add);
  const addAndInviteParticipant = useAction(api.participants.addAndInvite);
  const removeParticipant = useMutation(api.participants.remove);
  const updateParticipantMutation = useMutation(api.participants.update);

  const visibleParticipants = useMemo(
    () =>
      participants.filter(
        (p) => !p.serverId || !removedIds.has(p.serverId),
      ),
    [participants, removedIds],
  );

  function pushParticipant(p: ParsedParticipant, role: string | null = null) {
    const email = p.email.toLowerCase();
    if (
      visibleParticipants.some(
        (existing) => existing.email.toLowerCase() === email,
      )
    ) {
      return false;
    }
    setParticipants((prev) => [
      ...prev,
      {
        localKey: nextLocalKey(),
        email,
        name: p.name,
        role,
      },
    ]);
    return true;
  }

  function handleAddOne() {
    setError(null);
    const trimmed = addEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    const added = pushParticipant(
      { email: trimmed, name: addName.trim() || null },
      addRole.trim() || null,
    );
    if (!added) {
      setError(`${trimmed} is already a participant.`);
      return;
    }
    setAddEmail("");
    setAddName("");
    setAddRole("");
  }

  function handleBulkParse() {
    setError(null);
    const result = parseBulkParticipants(bulkText);
    let added = 0;
    let dupes = 0;
    for (const p of result.parsed) {
      const ok = pushParticipant(p);
      if (ok) added += 1;
      else dupes += 1;
    }
    setSkippedLines(result.skipped);
    setBulkText("");
    if (added === 0 && dupes === 0 && result.skipped.length === 0) {
      setError("Nothing to parse. Paste emails one per line.");
    }
  }

  function handleRemove(p: LocalParticipant) {
    if (p.serverId) {
      if (isActive) {
        setError(
          "Removing participants from an active workshop is not supported in M2.",
        );
        return;
      }
      setRemovedIds((prev) => new Set(prev).add(p.serverId!));
    } else {
      setParticipants((prev) =>
        prev.filter((x) => x.localKey !== p.localKey),
      );
    }
  }

  async function handleSaveDraft() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const trimmedName = name.trim();
      if (trimmedName.length === 0) {
        throw new Error("Workshop name is required");
      }

      if (isNew) {
        const id = await createWorkshop({
          name: trimmedName,
          description: description.trim() || undefined,
        });

        const updates: Record<string, unknown> = {};
        if (anonymityMode !== "anonymous") {
          updates.anonymityMode = anonymityMode;
        }
        if (subject !== DEFAULT_SUBJECT || body !== DEFAULT_BODY) {
          updates.emailTemplates = { invite: { subject, body } };
        }
        const ts = msFromYmd(phase1Ymd);
        if (ts !== undefined) {
          updates.phaseDeadlines = { phase1: ts };
        }
        if (Object.keys(updates).length > 0) {
          await updateWorkshop({ id, patch: updates });
        }

        for (const p of visibleParticipants) {
          await addParticipant({
            workshopId: id,
            email: p.email,
            name: p.name,
            role: p.role,
          });
        }

        router.push(`/workshops/${id}/edit`);
        return;
      }

      // Edit mode — diff against the loaded workshop.
      const original = initialData!.workshop;
      const updates: Record<string, unknown> = {};
      if (trimmedName !== original.name) updates.name = trimmedName;
      const newDesc = description.trim();
      if (newDesc !== (original.description ?? "")) {
        updates.description = newDesc;
      }
      if (!isActive && anonymityMode !== original.anonymityMode) {
        updates.anonymityMode = anonymityMode;
      }
      if (
        !isActive &&
        (subject !== original.emailTemplates.invite.subject ||
          body !== original.emailTemplates.invite.body)
      ) {
        updates.emailTemplates = { invite: { subject, body } };
      }
      const newDeadlineMs = msFromYmd(phase1Ymd);
      if (newDeadlineMs !== original.phaseDeadlines.phase1) {
        updates.phaseDeadlines = { phase1: newDeadlineMs };
      }
      if (Object.keys(updates).length > 0) {
        await updateWorkshop({ id: original._id, patch: updates });
      }

      // Apply participant diffs.
      for (const id of removedIds) {
        await removeParticipant({ id });
      }
      for (const p of participants) {
        if (!p.serverId) {
          if (isActive) {
            // Post-launch additions need an invite email; the action wraps
            // participants.add and sends in one call.
            await addAndInviteParticipant({
              workshopId: original._id,
              email: p.email,
              name: p.name,
              role: p.role,
            });
          } else {
            await addParticipant({
              workshopId: original._id,
              email: p.email,
              name: p.name,
              role: p.role,
            });
          }
        } else if (
          !removedIds.has(p.serverId) &&
          (p.name !== p.originalName || p.role !== p.originalRole)
        ) {
          await updateParticipantMutation({
            id: p.serverId,
            patch: { name: p.name, role: p.role },
          });
        }
      }

      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  // Live preview text
  const previewName = visibleParticipants[0]?.name || "Alice Rodriguez";
  const previewEmail =
    visibleParticipants[0]?.email || "alice@example.com";
  const previewWorkshopName = name || "Untitled workshop";
  const previewMagicLink = `https://catagree.app/p/${PREVIEW_TOKEN}`;

  function applyTokens(s: string): string {
    return s
      .replaceAll("{{participantName}}", previewName)
      .replaceAll("{{workshopName}}", previewWorkshopName)
      .replaceAll("{{magicLink}}", previewMagicLink);
  }

  if (isDeleted) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-10 text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            This workshop has been deleted
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Deleted workshops are read-only. Magic links resolve to a
            “workshop has ended” page for participants.
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10 pb-32">
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

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          {isNew ? "New workshop" : "Edit workshop"}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {isActive
            ? "This workshop is live. Most fields are locked. Adding participants and editing future phase templates lands when launch is wired up."
            : "Set up participants and invite copy. You can save a draft and come back."}
        </p>
      </div>

      {/* Basics */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Basics</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Workshop name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Description{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are participants helping you figure out?"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>
        </div>
      </section>

      {/* Participants */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-5">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Participants</h2>
          <span className="text-xs text-gray-500">
            {visibleParticipants.length} added
          </span>
        </div>

        {visibleParticipants.length > 0 && (
          <div className="border border-gray-100 rounded-lg overflow-hidden mb-4">
            <div className="grid grid-cols-[1fr_1fr_120px_32px] gap-3 px-3 py-2 bg-gray-50 border-b border-gray-100 text-[11px] font-medium text-gray-500 uppercase tracking-wide">
              <div>Email</div>
              <div>Name</div>
              <div>Role</div>
              <div></div>
            </div>
            {visibleParticipants.map((p, i) => (
              <div
                key={p.localKey}
                className={`grid grid-cols-[1fr_1fr_120px_32px] gap-3 px-3 py-2.5 items-center ${
                  i < visibleParticipants.length - 1
                    ? "border-b border-gray-100"
                    : ""
                }`}
              >
                <div className="text-sm text-gray-900 truncate">{p.email}</div>
                <input
                  type="text"
                  value={p.name ?? ""}
                  onChange={(e) =>
                    setParticipants((prev) =>
                      prev.map((x) =>
                        x.localKey === p.localKey
                          ? { ...x, name: e.target.value || null }
                          : x,
                      ),
                    )
                  }
                  placeholder="—"
                  className="text-sm text-gray-700 px-2 py-1 rounded border border-transparent hover:border-gray-200 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  type="text"
                  value={p.role ?? ""}
                  onChange={(e) =>
                    setParticipants((prev) =>
                      prev.map((x) =>
                        x.localKey === p.localKey
                          ? { ...x, role: e.target.value || null }
                          : x,
                      ),
                    )
                  }
                  placeholder="—"
                  className="text-sm text-gray-500 px-2 py-1 rounded border border-transparent hover:border-gray-200 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(p)}
                  disabled={isActive && !!p.serverId}
                  className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title={
                    isActive && p.serverId
                      ? "Removing participants from active workshops is not supported in M2"
                      : "Remove"
                  }
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.75 1A2.75 2.75 0 006 3.75H3.5a.75.75 0 000 1.5h.056l.67 10.04A2.75 2.75 0 006.97 18h6.06a2.75 2.75 0 002.744-2.71l.67-10.04h.056a.75.75 0 000-1.5H14a2.75 2.75 0 00-2.75-2.75h-2.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-[1fr_1fr_120px_auto] gap-2 mb-4">
          <input
            type="email"
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            placeholder="email@example.com"
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <input
            type="text"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="Name (optional)"
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <input
            type="text"
            value={addRole}
            onChange={(e) => setAddRole(e.target.value)}
            placeholder="Role (optional)"
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <Button
            type="button"
            onClick={handleAddOne}
            variant="secondary"
            className="bg-gray-900 text-white hover:bg-gray-700"
          >
            Add
          </Button>
        </div>

        <details className="border-t border-gray-100 pt-4">
          <summary className="cursor-pointer text-sm text-primary hover:opacity-80 font-medium inline-flex items-center gap-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a.75.75 0 01.75.75v5.5h5.5a.75.75 0 010 1.5h-5.5v5.5a.75.75 0 01-1.5 0v-5.5h-5.5a.75.75 0 010-1.5h5.5v-5.5A.75.75 0 0110 3z"
                clipRule="evenodd"
              />
            </svg>
            Bulk paste participants
          </summary>
          <div className="mt-3 space-y-3">
            <p className="text-xs text-gray-500">
              Paste emails one per line, or comma-separated. Accepts{" "}
              <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">
                name@example.com
              </code>{" "}
              or{" "}
              <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">
                Alice Rodriguez &lt;alice@example.com&gt;
              </code>
              .
            </p>
            <textarea
              rows={4}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={
                "Alice Rodriguez <alice@example.com>\nben@example.com\ncleo@example.com, dan@example.com"
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-mono shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
            {skippedLines.length > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2.5 py-1.5">
                {skippedLines.length} line
                {skippedLines.length === 1 ? "" : "s"} weren&apos;t valid
                emails and{" "}
                {skippedLines.length === 1 ? "was" : "were"} skipped:{" "}
                <span className="font-mono">
                  {skippedLines.slice(0, 3).join(", ")}
                  {skippedLines.length > 3 ? "…" : ""}
                </span>
              </p>
            )}
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleBulkParse}
                variant="secondary"
                className="bg-gray-900 text-white hover:bg-gray-700"
              >
                Parse &amp; add
              </Button>
            </div>
          </div>
        </details>
      </section>

      {/* Anonymity */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Anonymity</h2>
        <p className="text-xs text-gray-500 mb-4">
          Controls whether participant names appear in reports.{" "}
          {isActive
            ? "Locked — workshop is already launched."
            : "Locked once the workshop launches."}
        </p>
        <div className="space-y-3">
          {(["anonymous", "attributed"] as const).map((mode) => {
            const checked = anonymityMode === mode;
            return (
              <label
                key={mode}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${
                  checked
                    ? "border-primary/40 bg-primary/5"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                } ${isActive ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <input
                  type="radio"
                  name="anonymity"
                  checked={checked}
                  onChange={() => !isActive && setAnonymityMode(mode)}
                  disabled={isActive}
                  className="mt-0.5 text-primary focus:ring-primary"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {mode === "anonymous" ? "Anonymous" : "Attributed"}
                  </div>
                  <div className="text-xs text-gray-600">
                    {mode === "anonymous"
                      ? "Reports show contributions without names. Recommended for most workshops."
                      : "Reports show who contributed what. Useful for internal teams where ownership matters."}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      {/* Invite email */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">
          Invite email
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          {isActive
            ? "Already sent — locked. Future phase templates will be editable here."
            : "Sent to participants when you launch the workshop."}
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isActive}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Body
            </label>
            <textarea
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={isActive}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">
              Available placeholders:
            </span>
            {[
              "{{participantName}}",
              "{{workshopName}}",
              "{{magicLink}}",
            ].map((token) => (
              <code
                key={token}
                className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-[11px] text-gray-700"
              >
                {token}
              </code>
            ))}
          </div>
          <div className="border border-gray-100 rounded-lg bg-gray-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100">
              <span className="text-xs font-medium text-gray-700">
                Preview (as {previewName})
              </span>
              <span className="text-[11px] text-gray-400">
                onboarding@resend.dev → {previewEmail}
              </span>
            </div>
            <div className="px-4 py-4">
              <div className="text-sm font-semibold text-gray-900 mb-3">
                {applyTokens(subject)}
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {applyTokens(body)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Phase 1 deadline */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">
          Phase 1 deadline{" "}
          <span className="text-gray-400 font-normal text-xs">(optional)</span>
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Shown to participants as a soft deadline. You can close Phase 1
          manually at any time.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={phase1Ymd}
            onChange={(e) => setPhase1Ymd(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {phase1Ymd && (
            <button
              type="button"
              onClick={() => setPhase1Ymd("")}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Sticky footer */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 shadow-lg">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            <span className="font-medium text-gray-700">
              {visibleParticipants.length} participant
              {visibleParticipants.length === 1 ? "" : "s"}
            </span>
            {isNew
              ? " · saving creates a draft"
              : isActive
                ? " · workshop is live"
                : " · ready to launch"}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={saving}
            >
              {saving ? "Saving…" : isNew ? "Save draft" : "Save changes"}
            </Button>
            <Button
              type="button"
              disabled={isNew || isActive || saving}
              onClick={() => setLaunchOpen(true)}
              title={
                isNew
                  ? "Save the draft first, then launch."
                  : isActive
                    ? "Workshop is already live."
                    : "Send invites and start Phase 1."
              }
            >
              Launch workshop
            </Button>
          </div>
        </div>
      </div>

      {!isNew && !isActive && initialData && (
        <LaunchDialog
          open={launchOpen}
          onOpenChange={setLaunchOpen}
          workshopId={initialData.workshop._id}
          workshopName={name || initialData.workshop.name}
          participantCount={visibleParticipants.length}
        />
      )}
    </main>
  );
}
