import { handleWebSocket } from "@livestore/sync-cf/cf-worker";
import { jwtVerify } from "jose";
import type { SyncTokenPayload } from "@asu/shared";

export { WebSocketServer } from "./durable-object.ts";

interface Env {
  AUTH_JWT_SECRET: string;
  ADMIN_SECRET: string;
  WEBSOCKET_SERVER: DurableObjectNamespace;
  DB: D1Database;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (url.pathname === "/health") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (url.pathname.endsWith("/websocket")) {
      return handleWebSocket(request, env, ctx, {
        headers: corsHeaders,
        validatePayload: async (payload) => {
          const { authToken } = payload as { authToken?: string };
          if (!authToken) {
            throw new Error("Missing auth token");
          }

          const secret = new TextEncoder().encode(env.AUTH_JWT_SECRET);
          const { payload: jwtPayload } = await jwtVerify(authToken, secret);
          const tokenData = jwtPayload as unknown as SyncTokenPayload;

          const storeId = url.searchParams.get("storeId");
          if (storeId && storeId !== tokenData.orgId) {
            throw new Error("storeId does not match token orgId");
          }
        },
      });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  },
};
