import { Hono } from "hono";
import type { AppEnv } from "../types.ts";
import { invite, membership } from "../schema.ts";
import { requireAuth } from "../middleware/auth.ts";
import { eq, and, isNull } from "drizzle-orm";

const app = new Hono<AppEnv>();

app.use("*", requireAuth);

// Create invite (admin only)
app.post("/:orgId/invites", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const orgId = c.req.param("orgId");

  // Verify user is admin of this org
  const userMembership = await db
    .select()
    .from(membership)
    .where(and(eq(membership.orgId, orgId), eq(membership.userId, user.id)))
    .then((rows) => rows[0]);

  if (!userMembership || userMembership.role !== "admin") {
    return c.json({ error: "Admin access required" }, 403);
  }

  const code = crypto.randomUUID().slice(0, 8).toUpperCase();
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(invite).values({
    id,
    orgId,
    code,
    createdBy: user.id,
    expiresAt,
  });

  return c.json({ code, expiresAt });
});

// Redeem invite
app.post("/invites/:code/redeem", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const code = c.req.param("code");

  const inv = await db
    .select()
    .from(invite)
    .where(and(eq(invite.code, code), isNull(invite.usedAt)))
    .then((rows) => rows[0]);

  if (!inv) {
    return c.json({ error: "Invalid or used invite" }, 400);
  }

  if (new Date() > inv.expiresAt) {
    return c.json({ error: "Invite expired" }, 400);
  }

  // Check if already a member
  const existing = await db
    .select()
    .from(membership)
    .where(
      and(eq(membership.orgId, inv.orgId), eq(membership.userId, user.id))
    )
    .then((rows) => rows[0]);

  if (existing) {
    return c.json({ error: "Already a member" }, 400);
  }

  const membershipId = crypto.randomUUID();

  await db.insert(membership).values({
    id: membershipId,
    userId: user.id,
    orgId: inv.orgId,
    role: "member",
  });

  await db
    .update(invite)
    .set({ usedAt: new Date(), usedBy: user.id })
    .where(eq(invite.id, inv.id));

  return c.json({ orgId: inv.orgId });
});

export default app;
