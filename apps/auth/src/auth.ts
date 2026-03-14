import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "./schema.ts";
import type { Bindings } from "./types.ts";

export function getAuth(db: DrizzleD1Database<typeof schema>, env: Bindings) {
  return betterAuth({
    database: drizzleAdapter(db, { provider: "sqlite" }),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
    },
    plugins: [
      emailOTP({
        async sendVerificationOTP({ email, otp }) {
          // TODO: integrate email provider (e.g. Resend)
          console.log(`OTP for ${email}: ${otp}`);
        },
      }),
    ],
    trustedOrigins: env.CORS_ORIGINS?.split(",") ?? [],
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
      },
    },
  });
}
