import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#fafafa" }}>
      <style>{`
        .grid-bg {
          background-image:
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>

      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-semibold tracking-tight text-gray-900">CatAgree</span>
          <Link
            href="/sign-in"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Admin sign in →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="grid-bg flex-1 flex flex-col items-center justify-center px-6 pt-14">
        <div className="max-w-2xl w-full text-center py-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Building in public · Early access coming soon
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-5 leading-tight">
            Card sorting,<br />done asynchronously.
          </h1>

          <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
            CatAgree runs phased card sorting workshops on everyone&apos;s schedule —
            no live sessions, no scheduling battles. Ends with a stakeholder-ready content map.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Input type="email" placeholder="your@email.com" className="w-full sm:w-64" />
            <Button>Notify me</Button>
          </div>
          <p className="text-xs text-gray-400 mt-3">No spam. I&apos;ll email when early access opens.</p>
        </div>

        {/* Feature tiles */}
        <div className="max-w-3xl w-full grid grid-cols-1 sm:grid-cols-3 gap-4 pb-16">
          {[
            { icon: "⏱", title: "Async & phased", body: "Four gated phases run at your team's pace — no calendar Tetris." },
            { icon: "🃏", title: "Participants create cards", body: "Cards and categories come from your team, not a pre-set list." },
            { icon: "🗺", title: "Content map export", body: "Workshop ends with a validated map ready for stakeholders." },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mb-3 text-lg">
                {f.icon}
              </div>
              <h3 className="font-medium text-sm text-gray-900 mb-1">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        © 2026 CatAgree · MIT licensed ·{" "}
        <a
          href="https://github.com/jp206100/catagree"
          className="underline underline-offset-2"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}
