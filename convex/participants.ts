import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
} from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { sendInvite } from "./email";
import { requireAdminUserId, generateMagicLinkToken } from "./lib/auth";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export const add = mutation({
  args: {
    workshopId: v.id("workshops"),
    email: v.string(),
    name: v.optional(v.union(v.string(), v.null())),
    role: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await requireAdminUserId(ctx);
    const workshop = await ctx.db.get(args.workshopId);
    if (!workshop) throw new Error("Workshop not found");
    if (workshop.adminUserId !== userId) throw new Error("Not authorized");
    if (workshop.status === "deleted") {
      throw new Error("Cannot add participants to a deleted workshop");
    }

    const email = args.email.trim().toLowerCase();
    if (!isValidEmail(email)) throw new Error(`Invalid email: ${args.email}`);

    const existing = await ctx.db
      .query("participants")
      .withIndex("by_workshop", (q) => q.eq("workshopId", args.workshopId))
      .filter((q) => q.eq(q.field("email"), email))
      .first();
    if (existing) {
      throw new Error(`${email} is already a participant in this workshop`);
    }

    const token = generateMagicLinkToken();
    const tokenCollision = await ctx.db
      .query("participants")
      .withIndex("by_token", (q) => q.eq("magicLinkToken", token))
      .first();
    if (tokenCollision) {
      throw new Error("Token collision; please retry");
    }

    const now = Date.now();
    const isLaunched = workshop.status === "phase1_active";

    const cleanName =
      args.name == null ? null : args.name.trim().length === 0 ? null : args.name.trim();
    const cleanRole =
      args.role == null ? null : args.role.trim().length === 0 ? null : args.role.trim();

    const participantId = await ctx.db.insert("participants", {
      workshopId: args.workshopId,
      email,
      name: cleanName,
      role: cleanRole,
      magicLinkToken: token,
      magicLinkExpiresAt: isLaunched ? now + THIRTY_DAYS_MS : null,
      invitedAt: null,
      createdAt: now,
    });

    await ctx.db.insert("events", {
      workshopId: args.workshopId,
      actorType: "admin",
      actorId: userId,
      eventType: "participant.added",
      payload: { email, addedAfterLaunch: isLaunched },
      timestamp: now,
    });

    return participantId;
  },
});

export const remove = mutation({
  args: { id: v.id("participants") },
  handler: async (ctx, args) => {
    const userId = await requireAdminUserId(ctx);
    const participant = await ctx.db.get(args.id);
    if (!participant) throw new Error("Participant not found");
    const workshop = await ctx.db.get(participant.workshopId);
    if (!workshop) throw new Error("Workshop not found");
    if (workshop.adminUserId !== userId) throw new Error("Not authorized");
    if (workshop.status !== "draft") {
      throw new Error(
        "Removing participants from active workshops is not supported in M2",
      );
    }

    await ctx.db.delete(args.id);

    await ctx.db.insert("events", {
      workshopId: participant.workshopId,
      actorType: "admin",
      actorId: userId,
      eventType: "participant.removed",
      payload: { email: participant.email },
      timestamp: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("participants"),
    patch: v.object({
      name: v.optional(v.union(v.string(), v.null())),
      role: v.optional(v.union(v.string(), v.null())),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await requireAdminUserId(ctx);
    const participant = await ctx.db.get(args.id);
    if (!participant) throw new Error("Participant not found");
    const workshop = await ctx.db.get(participant.workshopId);
    if (!workshop) throw new Error("Workshop not found");
    if (workshop.adminUserId !== userId) throw new Error("Not authorized");
    if (workshop.status === "deleted") {
      throw new Error("Cannot edit participants in a deleted workshop");
    }

    const cleanPatch: Record<string, unknown> = {};
    if (args.patch.name !== undefined) {
      cleanPatch.name =
        args.patch.name == null
          ? null
          : args.patch.name.trim().length === 0
            ? null
            : args.patch.name.trim();
    }
    if (args.patch.role !== undefined) {
      cleanPatch.role =
        args.patch.role == null
          ? null
          : args.patch.role.trim().length === 0
            ? null
            : args.patch.role.trim();
    }
    if (Object.keys(cleanPatch).length === 0) return;

    await ctx.db.patch(args.id, cleanPatch);
  },
});

export const _getForInvite = internalQuery({
  args: { id: v.id("participants") },
  handler: async (ctx, args) => {
    const userId = await requireAdminUserId(ctx);
    const participant = await ctx.db.get(args.id);
    if (!participant) throw new Error("Participant not found");
    const workshop = await ctx.db.get(participant.workshopId);
    if (!workshop) throw new Error("Workshop not found");
    if (workshop.adminUserId !== userId) throw new Error("Not authorized");
    return { workshop, participant };
  },
});

export const _recordInvite = internalMutation({
  args: {
    workshopId: v.id("workshops"),
    participantId: v.id("participants"),
    result: v.union(
      v.object({ ok: v.literal(true), messageId: v.string() }),
      v.object({ ok: v.literal(false), error: v.string() }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    if (args.result.ok) {
      await ctx.db.insert("emailLog", {
        workshopId: args.workshopId,
        participantId: args.participantId,
        emailType: "invite",
        sentAt: now,
        status: "sent",
        resendMessageId: args.result.messageId,
        errorMessage: null,
      });
      await ctx.db.patch(args.participantId, { invitedAt: now });
      await ctx.db.insert("events", {
        workshopId: args.workshopId,
        actorType: "system",
        actorId: null,
        eventType: "participant.invited",
        payload: { messageId: args.result.messageId },
        timestamp: now,
      });
    } else {
      await ctx.db.insert("emailLog", {
        workshopId: args.workshopId,
        participantId: args.participantId,
        emailType: "invite",
        sentAt: now,
        status: "failed",
        resendMessageId: null,
        errorMessage: args.result.error,
      });
      await ctx.db.insert("events", {
        workshopId: args.workshopId,
        actorType: "system",
        actorId: null,
        eventType: "participant.invite_failed",
        payload: { error: args.result.error },
        timestamp: now,
      });
    }
  },
});

export const addAndInvite = action({
  args: {
    workshopId: v.id("workshops"),
    email: v.string(),
    name: v.optional(v.union(v.string(), v.null())),
    role: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    participantId: Id<"participants">;
    sent: boolean;
    error: string | null;
  }> => {
    const participantId = await ctx.runMutation(api.participants.add, args);
    const data = await ctx.runQuery(internal.participants._getForInvite, {
      id: participantId,
    });
    if (data.workshop.status !== "phase1_active") {
      return { participantId, sent: false, error: null };
    }

    const baseUrl = process.env.SITE_URL ?? "";
    const result = await sendInvite({
      to: data.participant.email,
      subjectTemplate: data.workshop.emailTemplates.invite.subject,
      bodyTemplate: data.workshop.emailTemplates.invite.body,
      vars: {
        participantName: data.participant.name,
        workshopName: data.workshop.name,
        magicLink: `${baseUrl}/p/${data.participant.magicLinkToken}`,
      },
    });

    await ctx.runMutation(internal.participants._recordInvite, {
      workshopId: data.workshop._id,
      participantId,
      result: result.ok
        ? { ok: true as const, messageId: result.messageId }
        : { ok: false as const, error: result.error },
    });

    return {
      participantId,
      sent: result.ok,
      error: result.ok ? null : result.error,
    };
  },
});
