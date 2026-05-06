import { LandingShell } from "./landing-shell";

export function LandingExpired({ workshopName }: { workshopName: string }) {
  return (
    <LandingShell>
      <div className="w-full bg-white border border-gray-100 rounded-2xl shadow-sm p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-5 text-amber-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-7 h-7"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .22.096.428.264.572l3.5 3a.75.75 0 00.972-1.144L10.75 9.658V5z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          This link has expired
        </h1>
        <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed mb-6">
          Invite links for{" "}
          <span className="font-medium text-gray-700">{workshopName}</span> are
          valid for 30 days. Please ask your workshop administrator to send
          you a new invite.
        </p>

        <div className="border-t border-gray-100 pt-5 mt-5 text-left">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Need help?
          </div>
          <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside">
            <li>Reply to the original invite email to request a new link.</li>
            <li>
              Check with your team lead — they may have a fresh invite waiting.
            </li>
          </ul>
        </div>
      </div>
    </LandingShell>
  );
}
