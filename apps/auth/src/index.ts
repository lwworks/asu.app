import { Hono } from "hono";
import type { AppEnv } from "./types.ts";
import { getDb } from "./db.ts";
import { getAuth } from "./auth.ts";
import orgsRoutes from "./routes/orgs.ts";
import invitesRoutes from "./routes/invites.ts";
import syncTokenRoutes from "./routes/sync-token.ts";

const app = new Hono<AppEnv>();

// Global error handler — ensures CORS headers on errors
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  const origins = c.env.CORS_ORIGINS?.split(",") ?? [];
  const origin = c.req.header("Origin");
  const allowedOrigin = origin && origins.includes(origin) ? origin : "";
  const res = c.json({ error: String(err) }, 500);
  if (allowedOrigin) {
    c.res.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    c.res.headers.set("Access-Control-Allow-Credentials", "true");
  }
  return res;
});

// Manual CORS — adds headers to every response including raw BetterAuth ones
app.use("*", async (c, next) => {
  const origins = c.env.CORS_ORIGINS?.split(",") ?? [];
  const origin = c.req.header("Origin");
  const allowedOrigin = origin && origins.includes(origin) ? origin : "";

  const addCorsHeaders = (res: Response) => {
    if (allowedOrigin) {
      res.headers.set("Access-Control-Allow-Origin", allowedOrigin);
      res.headers.set("Access-Control-Allow-Credentials", "true");
    }
  };

  // Preflight
  if (c.req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  await next();

  addCorsHeaders(c.res);
});

// Initialize db + auth per request
app.use("*", async (c, next) => {
  const db = getDb(c.env.DB);
  const auth = getAuth(db, c.env);
  c.set("db", db);
  c.set("auth", auth);
  return next();
});

// BetterAuth handles all /api/auth/* routes
app.all("/api/auth/*", async (c) => {
  try {
    const auth = c.get("auth");
    const response = await auth.handler(c.req.raw);
    // Return as a new mutable Response so CORS middleware can add headers
    c.res = new Response(response.body, response);
    return c.res;
  } catch (err) {
    console.error("BetterAuth error:", err);
    return c.json({ error: String(err) }, 500);
  }
});

// Custom routes
app.route("/api/orgs", orgsRoutes);
app.route("/api", invitesRoutes);
app.route("/api/sync-token", syncTokenRoutes);

app.get("/api/health", (c) => c.json({ status: "ok" }));

export default app;
