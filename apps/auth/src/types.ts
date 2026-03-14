import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "./schema.ts";

export type Bindings = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  JWT_SECRET: string;
  CORS_ORIGINS: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Auth = { handler: (request: Request) => any; api: { getSession: (opts: { headers: Headers }) => any } };

export type AppEnv = {
  Bindings: Bindings;
  Variables: {
    db: DrizzleD1Database<typeof schema>;
    auth: Auth;
    user: { id: string; email: string; name: string };
    session: { id: string };
  };
};
