import { LandingShell } from "./landing-shell";

export function LandingNotLaunched({
  workshopName,
}: {
  workshopName: string;
}) {
  return (
    <LandingShell>
      <div className="w-full bg-white border border-gray-100 rounded-2xl shadow-sm p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5 text-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-7 h-7"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          {workshopName} hasn&apos;t started yet
        </h1>
        <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed mb-6">
          The workshop administrator is still setting things up. You&apos;ll
          get another email as soon as it&apos;s ready for you to contribute.
        </p>

        <div className="border-t border-gray-100 pt-5 text-left">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            What to expect
          </div>
          <ul className="text-sm text-gray-600 space-y-1.5">
            <li className="flex gap-2">
              <span className="text-primary">1.</span>
              <span>You&apos;ll get an email when Phase 1 opens.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">2.</span>
              <span>Use the link in that email to start contributing cards.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">3.</span>
              <span>
                The workshop runs through four async phases over the next few
                weeks.
              </span>
            </li>
          </ul>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center">
        You can bookmark this page — it&apos;ll update automatically once the
        workshop opens.
      </p>
    </LandingShell>
  );
}
