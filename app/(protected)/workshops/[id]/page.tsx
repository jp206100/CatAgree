"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Cockpit } from "../_components/cockpit";

export default function WorkshopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const workshopId = id as Id<"workshops">;
  const data = useQuery(api.workshops.getForAdmin, { id: workshopId });
  const router = useRouter();

  useEffect(() => {
    if (data && data.workshop.status === "draft") {
      router.replace(`/workshops/${id}/edit`);
    }
  }, [data, id, router]);

  if (data === undefined) {
    return (
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-12 text-center text-sm text-gray-400">
          Loading workshop…
        </div>
      </main>
    );
  }

  if (data === null) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-10 text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Workshop not found
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            It may have never existed or you don&apos;t have access to it.
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </main>
    );
  }

  const w = data.workshop;

  if (w.status === "draft") {
    return (
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-12 text-center text-sm text-gray-400">
          Redirecting to editor…
        </div>
      </main>
    );
  }

  if (w.status === "deleted") {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-10 text-center">
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
            This workshop has been deleted
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Magic links resolve to a “workshop has ended” page for participants.
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </main>
    );
  }

  return <Cockpit workshopId={workshopId} />;
}
