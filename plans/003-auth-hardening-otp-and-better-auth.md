# Plan 003: Stop logging OTPs and upgrade better-auth past the account-takeover advisories

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ae62019..HEAD -- apps/auth/src/auth.ts apps/auth/package.json apps/web/package.json apps/auth/wrangler.toml`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/001-verification-baseline.md (worker typecheck; auth smoke checklist)
- **Category**: security
- **Planned at**: commit `ae62019`, 2026-09-18

## Why this matters

Two independent account-takeover paths exist today:

1. **OTP codes are written to production logs.** The email-OTP plugin's `sendVerificationOTP` does `console.log` with the user's email and the live one-time code, and `apps/auth/wrangler.toml` enables Cloudflare observability logs with invocation logs — so login codes are persisted where anyone with Workers log access (or a future log sink) can read them and sign in as any user.
2. **`better-auth` resolves to 1.5.5**, which is inside the advisory range for "Account takeover via pre-account hijacking on magic-link and email-OTP" (patched `>=1.6.22`) — this app enables exactly that combination (email+password with open registration, plus emailOTP). Several other high/critical advisories on 1.5.5 are patched by the same upgrade.

## Current state

- `apps/auth/src/auth.ts` — the entire BetterAuth configuration:

```8:32:apps/auth/src/auth.ts
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
```

- `apps/auth/wrangler.toml` lines 14–16 enable `[observability.logs]` with `invocation_logs = true` (leave this as-is; the fix is to stop logging secrets, not to disable observability).
- Version state: both `apps/auth/package.json` and `apps/web/package.json` declare `"better-auth": "^1.2.0"`; `pnpm-lock.yaml` resolves **1.5.5** for both. The web app uses it only for the client (`apps/web/src/lib/auth-client.ts` imports `createAuthClient` from `better-auth/react`).
- Advisory targets (from `pnpm audit --prod`, 2026-09-18): the email-OTP/magic-link pre-account-hijacking advisory is patched `>=1.6.22`; other reachable highs patched `>=1.6.11`/`>=1.6.13`. **Target: latest 1.x, minimum 1.6.22.**
- Env bindings type: `apps/auth/src/types.ts` (`Bindings` includes `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `JWT_SECRET`, `CORS_ORIGINS`, `DB`, `UPLOADS`). Secrets are set via `wrangler secret put` (see `apps/auth/.env.example` for names only — never copy values).
- Auth flows in the frontend: `apps/web/src/routes/anmelden.tsx` (login), `apps/web/src/routes/registrieren.tsx` (registration) — use them for the smoke test; they call the auth client against `VITE_AUTH_URL`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install/re-resolve | `pnpm install` | exit 0 |
| Auth typecheck | `pnpm --filter @asu/auth typecheck` | exit 0 |
| Web build | `pnpm --filter @asu/web build` | exit 0 |
| Audit check | `pnpm audit --prod 2>&1 \| grep -i better-auth` | no critical/high lines remain |
| Local auth worker | `pnpm --filter @asu/auth dev` | wrangler dev serves |
| Resolved version | `pnpm --filter @asu/auth why better-auth` | shows >=1.6.22 |

## Scope

**In scope** (the only files you should modify):
- `apps/auth/src/auth.ts`
- `apps/auth/src/types.ts` (only if adding an env binding for the email provider key name)
- `apps/auth/package.json`, `apps/web/package.json`, `pnpm-lock.yaml` (version bumps)
- `apps/auth/.env.example` (document new variable name with a placeholder)

**Out of scope** (do NOT touch, even though they look related):
- `apps/auth/wrangler.toml` observability settings — logging stays on.
- `apps/auth/src/routes/**`, `apps/auth/src/middleware/**` — invite/files/sync-token hardening is covered by plans 004 and the findings backlog, not here.
- BetterAuth schema/migrations under `apps/auth/migrations/` — see STOP conditions if the upgrade demands new columns.
- Cookie attributes (`sameSite: "none"`) — required by the cross-origin auth-worker architecture; do not change.

## Git workflow

- Branch: `advisor/003-auth-hardening`
- Commit per step; message style: short lowercase imperative, e.g. `stop logging otp codes`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Remove the OTP from logs and gate sending on a configured provider

Replace the `sendVerificationOTP` body. Target shape:

```ts
emailOTP({
  async sendVerificationOTP({ email, otp }) {
    if (env.RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.OTP_EMAIL_FROM ?? "ASÜ.APP <noreply@xn--as-yka.app>",
          to: [email],
          subject: "Dein Anmeldecode",
          text: `Dein Anmeldecode lautet: ${otp}\n\nDer Code ist 5 Minuten gültig.`,
        }),
      });
      if (!res.ok) {
        console.error("OTP email send failed:", res.status);
        throw new Error("OTP delivery failed");
      }
      return;
    }
    // No provider configured: never log the code. Fail loudly so the
    // misconfiguration is visible instead of silently swallowing logins.
    console.error(`OTP requested for ${email} but no email provider is configured`);
    throw new Error("Email delivery not configured");
  },
}),
```

Add `RESEND_API_KEY?: string` and `OTP_EMAIL_FROM?: string` to `Bindings` in `apps/auth/src/types.ts`. Add both names (placeholder values only) to `apps/auth/.env.example`. German copy in the email is intentional — the app is German.

**Verify**: `pnpm --filter @asu/auth typecheck` → exit 0; `grep -rn "otp" apps/auth/src --include="*.ts" -i | grep -i "console.log"` → no matches.

### Step 2: Upgrade better-auth in both workspaces

Set `"better-auth": "^1.6.22"` (or the current latest 1.x if higher) in `apps/auth/package.json` AND `apps/web/package.json` (they must resolve to the same version), then `pnpm install`.

**Verify**: `pnpm --filter @asu/auth why better-auth` and `pnpm --filter @asu/web why better-auth` → both show the same version ≥ 1.6.22; `pnpm audit --prod 2>&1 | grep -iA2 better-auth` → no remaining critical/high advisories for better-auth.

### Step 3: Check for upgrade-driven schema or API changes

- `pnpm --filter @asu/auth typecheck` and `pnpm --filter @asu/web build` — fix only import-path/option-rename breakage inside the in-scope files.
- Check the BetterAuth changelog/migration notes between 1.5.5 and the target for D1/Drizzle schema additions (e.g. new columns on `user`/`session`). The Drizzle schema lives in `apps/auth/src/schema.ts` — if the upgrade requires schema changes, STOP (see below); generating migrations is an operator decision.

**Verify**: both typecheck/build commands exit 0.

### Step 4: Auth smoke test (local)

Run `pnpm --filter @asu/auth dev` (wrangler dev with local D1: migrations applied via `pnpm --filter @asu/auth db:migrate:local` if the local DB is empty) and `pnpm --filter @asu/web dev`. Manually:

1. Register a fresh user (email+password) on `/registrieren` → succeeds, session cookie set.
2. Log out, log back in on `/anmelden` → succeeds.
3. Request an email OTP → the request must **fail with the delivery-not-configured error** (no `RESEND_API_KEY` locally) and the wrangler dev console must NOT contain the OTP code.

If local env vars/secrets are unavailable, report which steps ran.

**Verify**: all three observations as described.

## Test plan

Manual smoke per Step 4 (no worker test infra exists yet — noted as deferred in plan 001). The machine-checkable guards are the grep in Step 1 and the audit check in Step 2.

## Done criteria

- [ ] `grep -rn "console.log" apps/auth/src/auth.ts` returns no matches
- [ ] `pnpm --filter @asu/auth why better-auth` shows ≥ 1.6.22, identical in web
- [ ] `pnpm audit --prod` shows no critical/high better-auth advisories
- [ ] `pnpm --filter @asu/auth typecheck` and `pnpm --filter @asu/web build` exit 0
- [ ] `apps/auth/.env.example` documents `RESEND_API_KEY` / `OTP_EMAIL_FROM` with placeholders only
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The better-auth upgrade requires database schema changes (new tables/columns for D1) — report the required migration; the operator must review and run `db:generate`/`db:migrate:*` themselves.
- The upgrade breaks `getSession` in `apps/auth/src/middleware/auth.ts` or the drizzle adapter signature — report the API diff rather than rewriting the middleware.
- `emailOTP` plugin options changed shape such that the Step 1 code cannot be expressed — report the new signature.
- You find yourself editing any route file to make typecheck pass.

**Operator follow-ups this plan cannot do** (include in final report): create a Resend (or other provider) account, set `RESEND_API_KEY` via `wrangler secret put`, and treat historical Cloudflare logs as compromised — any OTPs already logged are burned; consider invalidating active sessions after deploy.

## Maintenance notes

- Future BetterAuth upgrades: always bump web and auth together (same resolved version) — consider a pnpm catalog entry.
- Reviewer: scrutinize that the OTP failure path throws (fail-closed) rather than logging-and-continuing, and that no error message includes the OTP value.
- Deferred: email verification requirements on password registration (`requireEmailVerification`) — product decision, interacts with invite onboarding; raise separately.
