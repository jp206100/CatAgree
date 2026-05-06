import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

// convex-test scans function modules via Vite's import.meta.glob. Cast to
// `any` because the Next.js tsconfig doesn't pull in vite/client types and
// adding them globally just for tests would be louder than this one-line
// escape hatch.
const modules = (
  import.meta as unknown as { glob: (pattern: string) => Record<string, () => Promise<unknown>> }
).glob("./**/*.*s");

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const DEFAULT_INVITE = {
  invite: {
    subject: "You're invited",
    body: "Hi {{participantName}}, click {{magicLink}}",
  },
};

async function setupActiveWorkshop(
  t: ReturnType<typeof convexTest>,
  overrides?: {
    participantExpiresAt?: number | null;
    workshopStatus?: "draft" | "phase1_active" | "deleted";
    launchedAt?: number | null;
    participantToken?: string;
  },
) {
  return await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      name: "Admin",
      email: "admin@example.com",
    });
    const now = Date.now();
    const launchedAt = overrides?.launchedAt ?? now;
    const status = overrides?.workshopStatus ?? "phase1_active";
    const workshopId = await ctx.db.insert("workshops", {
      name: "Spring 2026 IA refresh",
      description: undefined,
      adminUserId: userId,
      status,
      anonymityMode: "anonymous",
      emailTemplates: DEFAULT_INVITE,
      phaseDeadlines: {},
      createdAt: now,
      launchedAt: status === "phase1_active" ? launchedAt : null,
      deletedAt: status === "deleted" ? now : null,
    });
    const participantId = await ctx.db.insert("participants", {
      workshopId,
      email: "alice@example.com",
      name: "Alice Rodriguez",
      role: "Designer",
      magicLinkToken: overrides?.participantToken ?? "valid-token-abc",
      magicLinkExpiresAt:
        overrides?.participantExpiresAt === undefined
          ? launchedAt + THIRTY_DAYS_MS
          : overrides.participantExpiresAt,
      invitedAt: now,
      createdAt: now,
    });
    return { userId, workshopId, participantId };
  });
}

describe("participants.resolveByToken", () => {
  test("returns ok for a valid active-workshop token", async () => {
    const t = convexTest(schema, modules);
    await setupActiveWorkshop(t);

    const result = await t.query(api.participants.resolveByToken, {
      token: "valid-token-abc",
    });

    expect(result.state).toBe("ok");
    if (result.state === "ok") {
      expect(result.participant.email).toBe("alice@example.com");
      expect(result.participant.name).toBe("Alice Rodriguez");
      expect(result.workshop.name).toBe("Spring 2026 IA refresh");
      // Token must never appear in the response.
      expect(JSON.stringify(result)).not.toContain("valid-token-abc");
    }
  });

  test("returns expired when the link has aged past its expiry", async () => {
    const t = convexTest(schema, modules);
    await setupActiveWorkshop(t, {
      participantExpiresAt: Date.now() - 60_000, // 1 minute ago
    });

    const result = await t.query(api.participants.resolveByToken, {
      token: "valid-token-abc",
    });

    expect(result.state).toBe("expired");
    if (result.state === "expired") {
      expect(result.workshopName).toBe("Spring 2026 IA refresh");
    }
  });

  test("returns workshop_deleted for a soft-deleted workshop", async () => {
    const t = convexTest(schema, modules);
    await setupActiveWorkshop(t, { workshopStatus: "deleted" });

    const result = await t.query(api.participants.resolveByToken, {
      token: "valid-token-abc",
    });

    expect(result.state).toBe("workshop_deleted");
  });

  test("returns not_found for an unknown token", async () => {
    const t = convexTest(schema, modules);
    await setupActiveWorkshop(t);

    const result = await t.query(api.participants.resolveByToken, {
      token: "this-token-does-not-exist",
    });

    expect(result.state).toBe("not_found");
  });

  test("returns not_launched for a draft workshop", async () => {
    const t = convexTest(schema, modules);
    await setupActiveWorkshop(t, {
      workshopStatus: "draft",
      participantExpiresAt: null,
    });

    const result = await t.query(api.participants.resolveByToken, {
      token: "valid-token-abc",
    });

    expect(result.state).toBe("not_launched");
    if (result.state === "not_launched") {
      expect(result.workshopName).toBe("Spring 2026 IA refresh");
    }
  });

  test("never echoes the magic-link token in any state", async () => {
    const t = convexTest(schema, modules);
    const TOKEN = "secret-do-not-leak-zzz";
    await setupActiveWorkshop(t, { participantToken: TOKEN });

    const result = await t.query(api.participants.resolveByToken, {
      token: TOKEN,
    });

    expect(JSON.stringify(result)).not.toContain(TOKEN);
  });
});

