/**
 * Email sending via Resend's REST API.
 *
 * Calls https://api.resend.com/emails directly via fetch, which works in
 * Convex's V8 isolate without needing `"use node"`. The Resend npm SDK would
 * also work but adds a dependency and forces the module to Node runtime.
 *
 * RESEND_API_KEY must be set in the Convex deployment env (not Next.js):
 *   npx convex env set RESEND_API_KEY re_xxx
 *   npx convex env set --prod RESEND_API_KEY re_xxx
 */

const RESEND_API_URL = "https://api.resend.com/emails";
const SENDER = "onboarding@resend.dev";
const NAME_FALLBACK = "there";

export type InviteRenderVars = {
  participantName: string | null;
  workshopName: string;
  magicLink: string;
};

export type SendInviteResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

function applyTokens(template: string, vars: InviteRenderVars): string {
  const name = vars.participantName ?? NAME_FALLBACK;
  return template
    .replaceAll("{{participantName}}", name)
    .replaceAll("{{workshopName}}", vars.workshopName)
    .replaceAll("{{magicLink}}", vars.magicLink);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHtml(template: string, vars: InviteRenderVars): string {
  const name = vars.participantName ?? NAME_FALLBACK;
  const escapedTemplate = escapeHtml(template);
  const replaced = escapedTemplate
    .replaceAll("{{participantName}}", escapeHtml(name))
    .replaceAll("{{workshopName}}", escapeHtml(vars.workshopName))
    .replaceAll(
      "{{magicLink}}",
      `<a href="${escapeHtml(vars.magicLink)}" style="color:#3b55e6;text-decoration:underline">${escapeHtml(vars.magicLink)}</a>`,
    )
    .replaceAll("\n", "<br>");
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,system-ui,sans-serif;color:#1f2937;line-height:1.6;max-width:560px;margin:0 auto;padding:24px;">${replaced}</body></html>`;
}

export async function sendInvite(args: {
  to: string;
  subjectTemplate: string;
  bodyTemplate: string;
  vars: InviteRenderVars;
}): Promise<SendInviteResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: "RESEND_API_KEY is not set in the Convex deployment env",
    };
  }

  const subject = applyTokens(args.subjectTemplate, args.vars);
  const text = applyTokens(args.bodyTemplate, args.vars);
  const html = renderHtml(args.bodyTemplate, args.vars);

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: SENDER,
        to: args.to,
        subject,
        text,
        html,
      }),
    });

    if (!res.ok) {
      let detail = `${res.status}`;
      try {
        const body = (await res.json()) as { message?: string; name?: string };
        if (body.message) detail = `${res.status} ${body.message}`;
      } catch {
        // body wasn't JSON; use status code only
      }
      return { ok: false, error: `Resend ${detail}` };
    }

    const data = (await res.json()) as { id?: string };
    if (!data.id) {
      return { ok: false, error: "Resend returned no message id" };
    }
    return { ok: true, messageId: data.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Network error calling Resend: ${msg}` };
  }
}
