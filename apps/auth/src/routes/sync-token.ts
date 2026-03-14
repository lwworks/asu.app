import { Hono } from "hono";
import type { AppEnv } from "../types.ts";
import { SignJWT } from "jose";
import { membership } from "../schema.ts";
import { requireAuth } from "../middleware/auth.ts";
import { eq, and } from "drizzle-orm";
import type { SyncTokenPayload } from "@asu/shared";

const app = new Hono<AppEnv>();

app.use("*", requireAuth);

app.get("/", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const orgId = c.req.query("orgId");

  if (!orgId) {
    return c.json({ error: "orgId is required" }, 400);
  }

  // Verify membership
  const userMembership = await db
    .select()
    .from(membership)
    .where(and(eq(membership.orgId, orgId), eq(membership.userId, user.id)))
    .then((rows) => rows[0]);

  if (!userMembership) {
    return c.json({ error: "Not a member of this org" }, 403);
  }

  const secret = new TextEncoder().encode(c.env.JWT_SECRET);
  const payload: Omit<SyncTokenPayload, "exp"> = {
    userId: user.id,
    orgId,
  };

  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(secret);

  return c.json({ token });
});

export default app;
