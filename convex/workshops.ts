import { v } from "convex/values";
import {
  action,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { sendInvite } from "./email";
import { requireAdminUserId, DEFAULT_INVITE_TEMPLATE } from "./lib/auth";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAdminUserId(ctx);
    const name = args.name.trim();
    if (name.length === 0) {
      throw new Error("Workshop name is required");
    }

    const now = Date.now();
    const workshopId = await ctx.db.insert("workshops", {
      name,
      description: args.description?.trim() || undefined,
      adminUserId: userId,
      status: "draft",
      anonymityMode: "anonymous",
      emailTemplates: { invite: DEFAULT_INVITE_TEMPLATE },
      phaseDeadlines: {},
      createdAt: now,
      launchedAt: null,
      deletedAt: null,
    });

    await ctx.db.insert("events", {
      workshopId,
      actorType: "admin",
      actorId: userId,
      eventType: "workshop.created",
      payload: { name },
      timestamp: now,
    });

    return workshopId;
  },
});

export const update = mutation({
  args: {
    id: v.id("workshops"),
    patch: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      anonymityMode: v.optional(
        v.union(v.literal("anonymous"), v.literal("attributed")),
      ),
      emailTemplates: v.optional(
        v.object({
          invite: v.object({
            subject: v.string(),
            body: v.string(),
          }),
        }),
      ),
      phaseDeadlines: v.optional(
        v.object({ phase1: v.optional(v.number()) }),
      ),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await requireAdminUserId(ctx);
    const workshop = await ctx.db.get(args.id);
    if (!workshop) throw new Error("Workshop not found");
    if (workshop.adminUserId !== userId) throw new Error("Not authorized");
    if (workshop.status === "deleted") {
      throw new Error("Cannot edit a deleted workshop");
    }

    const patch = args.patch;
    const isActive = workshop.status === "phase1_active";

    if (isActive) {
      if (patch.anonymityMode !== undefined) {
        throw new Error(
          "Anonymity mode is locked once a workshop has launched",
        );
      }
      if (patch.emailTemplates !== undefined) {
        throw new Error(
          "The invite template cannot be edited after launch (it has already been sent)",
        );
      }
    }

    const cleanPatch: Record<string, unknown> = {};
    if (patch.name !== undefined) {
      const trimmed = patch.name.trim();
      if (trimmed.length === 0) throw new Error("Workshop name is required");
      cleanPatch.name = trimmed;
    }
    if (patch.description !== undefined) {
      const trimmed = patch.description.trim();
      cleanPatch.description = trimmed.length === 0 ? undefined : trimmed;
    }
    if (patch.anonymityMode !== undefined) {
      cleanPatch.anonymityMode = patch.anonymityMode;
    }
    if (patch.emailTemplates !== undefined) {
      cleanPatch.emailTemplates = patch.emailTemplates;
    }
    if (patch.phaseDeadlines !== undefined) {
      cleanPatch.phaseDeadlines = patch.phaseDeadlines;
    }

    if (Object.keys(cleanPatch).length === 0) return;

    await ctx.db.patch(args.id, cleanPatch);

    await ctx.db.insert("events", {
      workshopId: args.id,
      actorType: "admin",
      actorId: userId,
      eventType: "workshop.updated",
      payload: { fields: Object.keys(cleanPatch) },
      timestamp: Date.now(),
    });
  },
});

export const softDelete = mutation({
  args: { id: v.id("workshops") },
  handler: async (ctx, args) => {
    const userId = await requireAdminUserId(ctx);
    const workshop = await ctx.db.get(args.id);
    if (!workshop) throw new Error("Workshop not found");
    if (workshop.adminUserId !== userId) throw new Error("Not authorized");
    if (workshop.status === "deleted") return;

    const now = Date.now();
    await ctx.db.patch(args.id, { status: "deleted", deletedAt: now });
    await ctx.db.insert("events", {
      workshopId: args.id,
      actorType: "admin",
      actorId: userId,
      eventType: "workshop.deleted",
      payload: { previousStatus: workshop.status },
      timestamp: now,
    });
  },
});

export const listForAdmin = query({
  args: { includeDeleted: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const userId = await requireAdminUserId(ctx);
    const includeDeleted = args.includeDeleted ?? false;

    const workshops = await ctx.db
      .query("workshops")
      .withIndex("by_admin", (q) => q.eq("adminUserId", userId))
      .collect();

    const visible = includeDeleted
      ? workshops
      : workshops.filter((w) => w.status !== "deleted");

    const annotated = await Promise.all(
      visible.map(async (w) => {
        const participants = await ctx.db
          .query("participants")
          .withIndex("by_workshop", (q) => q.eq("workshopId", w._id))
          .collect();
        return { ...w, participantCount: participants.length };
      }),
    );

    annotated.sort((a, b) => b.createdAt - a.createdAt);
    return annotated;
  },
});

export const getForAdmin = query({
  args: { id: v.id("workshops") },
  handler: async (ctx, args) => {
    const userId = await requireAdminUserId(ctx);
    const workshop = await ctx.db.get(args.id);
    if (!workshop) return null;
    if (workshop.adminUserId !== userId) throw new Error("Not authorized");

    const participants = await ctx.db
      .query("participants")
      .withIndex("by_workshop", (q) => q.eq("workshopId", workshop._id))
      .collect();

    return { workshop, participants };
  },
});

export const getCockpit = query({
  args: { id: v.id("workshops") },
  handler: async (ctx, args) => {
    const userId = await requireAdminUserId(ctx);
    const workshop = await ctx.db.get(args.id);
    if (!workshop) return null;
    if (workshop.adminUserId !== userId) throw new Error("Not authorized");

    const participants = await ctx.db
      .query("participants")
      .withIndex("by_workshop", (q) => q.eq("workshopId", workshop._id))
      .collect();

    const enriched = await Promise.all(
      participants.map(async (p) => {
        const logs = await ctx.db
          .query("emailLog")
          .withIndex("by_participant", (q) => q.eq("participantId", p._id))
          .collect();
        const inviteLogs = logs.filter((l) => l.emailType === "invite");
        inviteLogs.sort((a, b) => b.sentAt - a.sentAt);
        const latestInvite = inviteLogs[0] ?? null;
        return { ...p, latestInvite };
      }),
    );

    return { workshop, participants: enriched };
  },
});

export const _startLaunch = internalMutation({
  args: { id: v.id("workshops") },
  handler: async (ctx, args) => {
    const userId = await requireAdminUserId(ctx);
    const workshop = await ctx.db.get(args.id);
    if (!workshop) throw new Error("Workshop not found");
    if (workshop.adminUserId !== userId) throw new Error("Not authorized");
    if (workshop.status !== "draft") {
      throw new Error("Only draft workshops can be launched");
    }
    if (workshop.name.trim().length === 0) {
      throw new Error("Workshop name is required");
    }
    if (!workshop.emailTemplates.invite.body.includes("{{magicLink}}")) {
      throw new Error(
        "Invite template body must contain the {{magicLink}} placeholder",
      );
    }

    const participants = await ctx.db
      .query("participants")
      .withIndex("by_workshop", (q) => q.eq("workshopId", args.id))
      .collect();
    if (participants.length === 0) {
      throw new Error("Add at least one participant before launching");
    }

    const launchedAt = Date.now();
    const expiresAt = launchedAt + THIRTY_DAYS_MS;

    await ctx.db.patch(args.id, {
      status: "phase1_active",
      launchedAt,
    });
    for (const p of participants) {
      await ctx.db.patch(p._id, { magicLinkExpiresAt: expiresAt });
    }

    return {
      workshopName: workshop.name,
      subjectTemplate: workshop.emailTemplates.invite.subject,
      bodyTemplate: workshop.emailTemplates.invite.body,
      participants: participants.map((p) => ({
        _id: p._id,
        email: p.email,
        name: p.name,
        magicLinkToken: p.magicLinkToken,
      })),
    };
  },
});

export const _completeLaunch = internalMutation({
  args: {
    id: v.id("workshops"),
    sent: v.number(),
    failed: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAdminUserId(ctx);
    await ctx.db.insert("events", {
      workshopId: args.id,
      actorType: "admin",
      actorId: userId,
      eventType: "workshop.launched",
      payload: { sent: args.sent, failed: args.failed },
      timestamp: Date.now(),
    });
  },
});

export const launch = action({
  args: { id: v.id("workshops") },
  handler: async (
    ctx,
    args,
  ): Promise<{ sent: number; failed: number }> => {
    const data = await ctx.runMutation(internal.workshops._startLaunch, {
      id: args.id,
    });

    const baseUrl = process.env.SITE_URL ?? "";
    let sent = 0;
    let failed = 0;

    for (const p of data.participants) {
      const result = await sendInvite({
        to: p.email,
        subjectTemplate: data.subjectTemplate,
        bodyTemplate: data.bodyTemplate,
        vars: {
          participantName: p.name,
          workshopName: data.workshopName,
          magicLink: `${baseUrl}/p/${p.magicLinkToken}`,
        },
      });

      await ctx.runMutation(internal.participants._recordInvite, {
        workshopId: args.id,
        participantId: p._id,
        result: result.ok
          ? { ok: true as const, messageId: result.messageId }
          : { ok: false as const, error: result.error },
      });

      if (result.ok) sent += 1;
      else failed += 1;
    }

    await ctx.runMutation(internal.workshops._completeLaunch, {
      id: args.id,
      sent,
      failed,
    });

    return { sent, failed };
  },
});

export const retryInvite = action({
  args: { participantId: v.id("participants") },
  handler: async (
    ctx,
    args,
  ): Promise<{ ok: boolean; error: string | null }> => {
    const data = await ctx.runQuery(internal.participants._getForInvite, {
      id: args.participantId,
    });
    if (data.workshop.status !== "phase1_active") {
      throw new Error("Can only retry invites for active workshops");
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
      participantId: args.participantId,
      result: result.ok
        ? { ok: true as const, messageId: result.messageId }
        : { ok: false as const, error: result.error },
    });

    return { ok: result.ok, error: result.ok ? null : result.error };
  },
});
