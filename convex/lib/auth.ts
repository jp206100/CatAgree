import { getAuthUserId } from "@convex-dev/auth/server";
import type { Auth } from "convex/server";

export async function requireAdminUserId(ctx: { auth: Auth }) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

export const DEFAULT_INVITE_TEMPLATE = {
  subject: "You're invited to a card sorting workshop: {{workshopName}}",
  body: `Hi {{participantName}},

You've been invited to take part in a card sorting workshop: {{workshopName}}.

Click the link below to get started. Your link is unique to you and will expire in 30 days.

{{magicLink}}

Thanks!`,
};

export function generateMagicLinkToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
