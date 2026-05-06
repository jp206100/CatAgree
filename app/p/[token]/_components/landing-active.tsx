import { LandingShell } from "./landing-shell";

type WorkshopSummary = {
  _id: string;
  name: string;
  description: string | null;
  phase1Deadline: number | null;
};

type ParticipantSummary = {
  _id: string;
  email: string;
  name: string | null;
  role: string | null;
  magicLinkExpiresAt: number | null;
};

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function LandingActive({
  workshop,
  participant,
}: {
  workshop: WorkshopSummary;
  participant: ParticipantSummary;
}) {
  const displayName = participant.name || participant.email;

  return (
    <LandingShell>
      <p className="text-sm text-gray-500 mb-1">Welcome,</p>
      <h2 className="text-base font-medium text-gray-900 mb-8">
        {displayName}{" "}
        <span className="text-gray-400 font-normal">
          · {participant.email}
        </span>
      </h2>

      <div className="w-full bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-medium mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Phase 1 of 4 · Active
        </div>

        <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">
          Workshop
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6 leading-snug">
          {workshop.name}
        </h1>

        <div className="flex items-center gap-1.5 justify-center mb-8">
          <div className="h-1.5 w-16 rounded-full bg-primary" />
          <div className="h-1.5 w-16 rounded-full bg-gray-200" />
          <div className="h-1.5 w-16 rounded-full bg-gray-200" />
          <div className="h-1.5 w-16 rounded-full bg-gray-200" />
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 mb-5 text-left">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-primary shrink-0 text-lg">
              🃏
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900 mb-1">
                Phase 1 · Contribute cards
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                In this phase, you&apos;ll add items you think belong in the
                site. One item per card — don&apos;t worry about categorizing
                yet.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 text-left">
          <div className="flex items-start gap-2.5">
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
            <div className="flex-1">
              <div className="text-sm font-medium text-amber-900">
                The contribution editor is still being built.
              </div>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                We&apos;ll email you at{" "}
                <span className="font-medium">{participant.email}</span> as
                soon as Phase 1 is ready for you to start adding cards. Your
                spot is saved — this link will still work.
              </p>
            </div>
          </div>
        </div>

        {workshop.phase1Deadline && (
          <p className="text-xs text-gray-500 mb-4">
            Phase 1 closes{" "}
            <span className="font-medium text-gray-700">
              {formatDate(workshop.phase1Deadline)}
            </span>
            .
          </p>
        )}

        <button
          disabled
          className="w-full px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium shadow-sm opacity-50 cursor-not-allowed"
        >
          Start contributing (coming soon)
        </button>
      </div>

      {participant.magicLinkExpiresAt && (
        <p className="text-xs text-gray-400 mt-6 text-center max-w-md leading-relaxed">
          This link is unique to you and expires on{" "}
          {formatDate(participant.magicLinkExpiresAt)}. Keep it private —
          anyone with the link can contribute as you.
        </p>
      )}
    </LandingShell>
  );
}
