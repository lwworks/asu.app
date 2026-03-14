import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../types.ts";

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const auth = c.get("auth");
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("user", session.user as AppEnv["Variables"]["user"]);
  c.set("session", session.session as AppEnv["Variables"]["session"]);
  return next();
});
