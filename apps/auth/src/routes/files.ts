import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import type { Context } from "hono";
import { requireAuth } from "../middleware/auth.ts";
import { membership } from "../schema.ts";
import type { AppEnv } from "../types.ts";

const MAX_BYTES = 25 * 1024 * 1024;
const KEY_RE =
  /^(organizations|operations)\/[A-Za-z0-9._-]+\/[A-Za-z0-9._/-]+$/;

function isValidKey(key: string) {
  return KEY_RE.test(key) && !key.includes("..") && !key.endsWith("/");
}

async function denyUnlessOrgMember(c: Context<AppEnv>, orgId: string) {
  const user = c.get("user");
  const db = c.get("db");
  const [row] = await db
    .select({ id: membership.id })
    .from(membership)
    .where(and(eq(membership.orgId, orgId), eq(membership.userId, user.id)));
  if (!row) {
    return c.json({ error: "Not a member" }, 403);
  }
  return null;
}

const app = new Hono<AppEnv>();

app.use("*", requireAuth);

app.put("/", async (c) => {
  const key = c.req.query("key");
  if (!key || !isValidKey(key)) {
    return c.json({ error: "Invalid key" }, 400);
  }

  const length = Number(c.req.header("content-length") ?? 0);
  if (length > MAX_BYTES) {
    return c.json({ error: "File too large" }, 413);
  }

  if (key.startsWith("organizations/")) {
    const denied = await denyUnlessOrgMember(c, key.split("/")[1]!);
    if (denied) return denied;
  }

  const body = c.req.raw.body;
  if (!body) {
    return c.json({ error: "Missing body" }, 400);
  }

  await c.env.UPLOADS.put(key, body, {
    httpMetadata: {
      contentType: c.req.header("content-type") ?? "application/octet-stream",
    },
  });

  return c.json({ key });
});

app.get("/", async (c) => {
  const key = c.req.query("key");
  if (!key || !isValidKey(key)) {
    return c.json({ error: "Invalid key" }, 400);
  }

  if (key.startsWith("organizations/")) {
    const denied = await denyUnlessOrgMember(c, key.split("/")[1]!);
    if (denied) return denied;
  }

  const object = await c.env.UPLOADS.get(key);
  if (!object) {
    return c.json({ error: "Not found" }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "private, max-age=300");
  for (const [name, value] of headers) {
    c.header(name, value);
  }

  return c.body(object.body);
});

export default app;
