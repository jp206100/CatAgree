import { LandingShell } from "./landing-shell";

export function LandingEnded() {
  return (
    <LandingShell>
      <div className="w-full bg-white border border-gray-100 rounded-2xl shadow-sm p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5 text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-7 h-7"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          This workshop has ended
        </h1>
        <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed mb-6">
          Thanks for taking part. The workshop is no longer accepting
          contributions, and the results have been handed over to the
          administrator.
        </p>

        <div className="border-t border-gray-100 pt-5 text-left">
          <p className="text-sm text-gray-600 leading-relaxed">
            If you have questions about the outcome or how your contributions
            were used, reach out to the person who originally invited you.
          </p>
        </div>
      </div>
    </LandingShell>
  );
}
