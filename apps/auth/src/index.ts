import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "./types.ts";
import { auth } from "./auth.ts";
import orgsRoutes from "./routes/orgs.ts";
import invitesRoutes from "./routes/invites.ts";
import syncTokenRoutes from "./routes/sync-token.ts";

const app = new Hono<AppEnv>();

app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGINS?.split(",") ?? [],
    credentials: true,
  })
);

// BetterAuth handles all /api/auth/* routes
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// Custom routes
app.route("/api/orgs", orgsRoutes);
app.route("/api", invitesRoutes);
app.route("/api/sync-token", syncTokenRoutes);

app.get("/api/health", (c) => c.json({ status: "ok" }));

const port = Number(process.env.PORT ?? 3000);
console.log(`Auth server running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
