"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const { signOut } = useAuthActions();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/sign-in");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isLoading) return;
    const warn = setTimeout(() => setTimedOut(true), 5000);
    const bail = setTimeout(() => {
      window.location.href = "/sign-in";
    }, 10000);
    return () => {
      clearTimeout(warn);
      clearTimeout(bail);
    };
  }, [isLoading]);

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="text-sm text-gray-400">Loading…</div>
          {timedOut && (
            <>
              <div className="text-xs text-red-500 max-w-xs">
                Auth is taking too long. Redirecting to sign-in…
              </div>
              <button
                className="text-xs text-blue-600 underline"
                onClick={() => {
                  window.location.href = "/sign-in";
                }}
              >
                Go now
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <a
            href="/dashboard"
            className="font-semibold tracking-tight text-gray-900 hover:text-gray-700"
          >
            SortLab
          </a>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
