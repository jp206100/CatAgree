import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  workshops: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    adminUserId: v.id("users"),
    status: v.union(
      v.literal("draft"),
      v.literal("phase1_active"),
      v.literal("deleted"),
    ),
    anonymityMode: v.union(
      v.literal("anonymous"),
      v.literal("attributed"),
    ),
    emailTemplates: v.object({
      invite: v.object({
        subject: v.string(),
        body: v.string(),
      }),
    }),
    phaseDeadlines: v.object({
      phase1: v.optional(v.number()),
    }),
    createdAt: v.number(),
    launchedAt: v.union(v.number(), v.null()),
    deletedAt: v.union(v.number(), v.null()),
  })
    .index("by_admin", ["adminUserId"])
    .index("by_status", ["status"]),

  participants: defineTable({
    workshopId: v.id("workshops"),
    email: v.string(),
    name: v.union(v.string(), v.null()),
    role: v.union(v.string(), v.null()),
    magicLinkToken: v.string(),
    magicLinkExpiresAt: v.union(v.number(), v.null()),
    invitedAt: v.union(v.number(), v.null()),
    createdAt: v.number(),
  })
    .index("by_workshop", ["workshopId"])
    .index("by_token", ["magicLinkToken"]),

  emailLog: defineTable({
    workshopId: v.id("workshops"),
    participantId: v.id("participants"),
    emailType: v.union(v.literal("invite")),
    sentAt: v.number(),
    status: v.union(v.literal("sent"), v.literal("failed")),
    resendMessageId: v.union(v.string(), v.null()),
    errorMessage: v.union(v.string(), v.null()),
  })
    .index("by_workshop", ["workshopId"])
    .index("by_participant", ["participantId"]),

  events: defineTable({
    workshopId: v.id("workshops"),
    actorType: v.union(
      v.literal("admin"),
      v.literal("participant"),
      v.literal("system"),
    ),
    actorId: v.union(v.string(), v.null()),
    eventType: v.string(),
    payload: v.any(),
    timestamp: v.number(),
  })
    .index("by_workshop", ["workshopId"])
    .index("by_timestamp", ["timestamp"]),
});
