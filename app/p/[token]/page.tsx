"use client";

import { useQuery } from "convex/react";
import { use } from "react";
import { api } from "@/convex/_generated/api";
import { LandingActive } from "./_components/landing-active";
import { LandingEnded } from "./_components/landing-ended";
import { LandingExpired } from "./_components/landing-expired";
import { LandingNotFound } from "./_components/landing-not-found";
import { LandingNotLaunched } from "./_components/landing-not-launched";
import { LandingShell } from "./_components/landing-shell";

export default function ParticipantLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const data = useQuery(api.participants.resolveByToken, { token });

  if (data === undefined) {
    return (
      <LandingShell>
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-12 text-center text-sm text-gray-400">
          Resolving your link…
        </div>
      </LandingShell>
    );
  }

  switch (data.state) {
    case "ok":
      return (
        <LandingActive
          workshop={data.workshop}
          participant={data.participant}
        />
      );
    case "expired":
      return <LandingExpired workshopName={data.workshopName} />;
    case "workshop_deleted":
      return <LandingEnded />;
    case "not_launched":
      return <LandingNotLaunched workshopName={data.workshopName} />;
    case "not_found":
      return <LandingNotFound />;
  }
}
