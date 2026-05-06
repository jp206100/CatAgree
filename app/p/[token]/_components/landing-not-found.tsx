import { LandingShell } from "./landing-shell";

export function LandingNotFound() {
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
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          We can&apos;t find that link
        </h1>
        <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed mb-6">
          The link may be mistyped, or the workshop administrator may have
          rotated it. Try copy-pasting the full URL from your invite email.
        </p>

        <div className="border-t border-gray-100 pt-5 text-left">
          <p className="text-sm text-gray-600 leading-relaxed">
            Still stuck? Reach out to the person who invited you for a fresh
            link.
          </p>
        </div>
      </div>
    </LandingShell>
  );
}
