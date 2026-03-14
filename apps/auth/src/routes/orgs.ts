import { Hono } from "hono";
import type { AppEnv } from "../types.ts";
import { db } from "../db.ts";
import { organization, membership } from "../schema.ts";
import { requireAuth } from "../middleware/auth.ts";
import { eq } from "drizzle-orm";

const app = new Hono<AppEnv>();

app.use("*", requireAuth);

// Create org
app.post("/", async (c) => {
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
  const user = c.get("user");

  const memberships = await db
    .select({
      orgId: membership.orgId,
      role: membership.role,
      name: organization.name,
      slug: organization.slug,
    })
    .from(membership)
    .innerJoin(organization, eq(membership.orgId, organization.id))
    .where(eq(membership.userId, user.id));

  return c.json(memberships);
});

// List org members
app.get("/:orgId/members", async (c) => {
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
