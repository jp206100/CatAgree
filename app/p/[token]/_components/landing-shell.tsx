export function LandingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans antialiased">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-semibold tracking-tight text-gray-900">
            CatAgree
          </span>
          <span className="text-xs text-gray-400">Workshop participant</span>
        </div>
      </header>
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-16 flex flex-col items-center justify-center">
        {children}
      </main>
    </div>
  );
}
