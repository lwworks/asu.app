import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { db } from "./db.ts";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
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
  trustedOrigins: process.env.CORS_ORIGINS?.split(",") ?? [],
});
