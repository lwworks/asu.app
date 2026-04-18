import { Hono } from "hono";
import type { AppEnv } from "../types.ts";
import { organization, membership } from "../schema.ts";
import { requireAuth } from "../middleware/auth.ts";
import { eq } from "drizzle-orm";

const app = new Hono<AppEnv>();

app.use("*", requireAuth);

// Create org
app.post("/", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const { name, slug } = await c.req.json<{ name: string; slug: string }>();

  if (!name || !slug) {
    return c.json({ error: "Name and slug are required" }, 400);
  }

  const orgId = crypto.randomUUID();
  const membershipId = crypto.randomUUID();

  await db.insert(organization).values({ id: orgId, name, slug });
  await db.insert(membership).values({
    id: membershipId,
    userId: user.id,
    orgId,
    role: "admin",
  });

  return c.json({ id: orgId, name, slug });
});

// List user's orgs
app.get("/", async (c) => {
  const db = c.get("db");
  const user = c.get("user");

  const memberships = await db
    .select({
      orgId: membership.orgId,
      role: membership.role,
      name: organization.name,
      slug: organization.slug,
      logoUrl: organization.logoUrl,
    })
    .from(membership)
    .innerJoin(organization, eq(membership.orgId, organization.id))
    .where(eq(membership.userId, user.id));

  return c.json(memberships);
});

// Update org (admin only)
app.patch("/:orgId", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const orgId = c.req.param("orgId");

  const userMembership = await db
    .select()
    .from(membership)
    .where(eq(membership.orgId, orgId))
    .then((rows) => rows.find((r) => r.userId === user.id));

  if (!userMembership) {
    return c.json({ error: "Not a member" }, 403);
  }
  if (userMembership.role !== "admin") {
    return c.json({ error: "Admin role required" }, 403);
  }

  const body = await c.req.json<{
    name?: string;
    logoUrl?: string | null;
  }>();

  const updates: { name?: string; logoUrl?: string | null } = {};
  if (typeof body.name === "string") {
    if (!body.name.trim()) {
      return c.json({ error: "Name cannot be empty" }, 400);
    }
    updates.name = body.name.trim();
  }
  if (body.logoUrl === null || typeof body.logoUrl === "string") {
    updates.logoUrl = body.logoUrl;
  }
  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No updates provided" }, 400);
  }

  await db.update(organization).set(updates).where(eq(organization.id, orgId));

  const [updated] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, orgId));

  return c.json(updated);
});

// List org members
app.get("/:orgId/members", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const orgId = c.req.param("orgId");

  // Verify user is a member
  const userMembership = await db
    .select()
    .from(membership)
    .where(eq(membership.orgId, orgId))
    .then((rows) => rows.find((r) => r.userId === user.id));

  if (!userMembership) {
    return c.json({ error: "Not a member" }, 403);
  }

  const members = await db
    .select()
    .from(membership)
    .where(eq(membership.orgId, orgId));

  return c.json(members);
});

export default app;
