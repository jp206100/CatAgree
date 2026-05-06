"use client";

import { useQuery } from "convex/react";
import { use } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { WorkshopForm } from "../../_components/workshop-form";

export default function EditWorkshopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const workshopId = id as Id<"workshops">;
  const data = useQuery(api.workshops.getForAdmin, { id: workshopId });

  if (data === undefined) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
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
          <a
            href="/dashboard"
            className="text-sm text-primary hover:opacity-80 underline underline-offset-2"
          >
            Back to dashboard
          </a>
        </div>
      </main>
    );
  }

  return <WorkshopForm initialData={data} />;
}
