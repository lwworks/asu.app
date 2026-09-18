# Plan 005: Keep sync authenticated past one hour (token refresh + honest error states)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ae62019..HEAD -- apps/web/src/context/org.tsx apps/web/src/livestore/index.tsx apps/web/src/routes/_app.tsx apps/auth/src/routes/sync-token.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none (001 recommended first for the test harness)
- **Category**: bug
- **Planned at**: commit `ae62019`, 2026-09-18

## Why this matters

The LiveStore sync WebSocket authenticates with a JWT that expires after **1 hour**, fetched exactly once when the org loads or switches. Nothing refreshes it. Emergency operations run for hours in the field with flaky networks: after the first hour, any reconnect (network drop, laptop sleep, tab restore) fails JWT verification on the sync worker and the client silently stops syncing while the UI looks live — a multi-user protocol app diverging without warning. Two adjacent bugs share the same files: a failed token fetch still mounts LiveStore with `syncToken!` (null), and a transient org-list fetch failure is treated as "user has no orgs", redirecting to the create-org page.

## Current state

- Token minting — `apps/auth/src/routes/sync-token.ts` (leave this file unchanged; 1h expiry is fine once the client refreshes):

```39:44:apps/auth/src/routes/sync-token.ts
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(secret);

  return c.json({ token });
```

- Client token handling — `apps/web/src/context/org.tsx`. `fetchSyncToken` (lines 41–48) fetches once; `switchOrg` (lines 69–83) sets `currentOrg` even when the token came back null; the load effect (lines 86–112) treats `!res.ok` as "no orgs" because `refreshOrgs` returns `undefined` on failure (lines 50–61); there is no refresh timer and no `cancelled` guard on the async IIFE.
- Mounting — `apps/web/src/routes/_app.tsx`:

```7:15:apps/web/src/routes/_app.tsx
function AppShell() {
  const { currentOrg, syncToken } = useOrg();

  return (
    <Livestore orgId={currentOrg!.orgId} syncToken={syncToken!}>
      <Outlet />
    </Livestore>
  );
}
```

- LiveStore provider — `apps/web/src/livestore/index.tsx`: `syncPayload` is `useMemo(() => ({ authToken: syncToken }), [syncToken])` passed to `LiveStoreProvider` with `key={orgId}` (remount only on org change, not token change — good, keep it that way).

```41:53:apps/web/src/livestore/index.tsx
  const syncPayload = useMemo(() => ({ authToken: syncToken }), [syncToken]);

  return (
    <LiveStoreProvider
      key={orgId}
      schema={schema}
      adapter={adapter}
      renderLoading={(_) => <Loading stage={_.stage} />}
      renderError={(_) => <StoreError error={String(_)} />}
      batchUpdates={batchUpdates}
      storeId={orgId}
      syncPayload={syncPayload}
    >
```

- Verification on the sync worker (`apps/sync/src/index.ts:42-59`): `validatePayload` runs `jwtVerify` per WebSocket connect — an updated `syncPayload` is picked up on the **next** connect. What is NOT verified in this plan: whether `@livestore/sync-cf@0.3.1` re-reads `syncPayload` on automatic reconnect, or snapshots it at provider mount. **Step 1 resolves this.**
- Existing convention for periodic refresh + online/visibility listeners with cleanup: `apps/web/src/context/current-time.tsx` lines 24–49 (interval + `online` + `visibilitychange` with a `cancelled` flag). Match that pattern.
- Reference docs available in-repo: `livestore-manual/14-sync-realtime.md` (sync/reconnect behavior).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Web build+typecheck | `pnpm --filter @asu/web build` | exit 0 |
| Web lint | `pnpm --filter @asu/web lint` | exit 0 |
| Web tests | `pnpm --filter @asu/web test` | all pass (if 001 landed) |
| Dev servers | `pnpm --filter @asu/web dev` / `--filter @asu/auth dev` / `--filter @asu/sync dev` | serve |

## Scope

**In scope** (the only files you should modify):
- `apps/web/src/context/org.tsx`
- `apps/web/src/routes/_app.tsx`
- `apps/web/src/livestore/index.tsx` (only if Step 1 findings require it)

**Out of scope** (do NOT touch, even though they look related):
- `apps/auth/src/routes/sync-token.ts` and the sync worker — server side is correct; 1h expiry stays.
- `apps/web/src/context/auth.tsx` — session handling is separate.
- Any LiveStore schema/query files.
- Upgrading `@livestore/*` — pinned pre-1.0; upgrades are a separate, high-risk effort.

## Git workflow

- Branch: `advisor/005-sync-token-lifecycle`
- Commit per step; message style: short lowercase imperative, e.g. `refresh sync token before expiry`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Establish how `syncPayload` reaches reconnects (investigation, ~30 min cap)

Read `livestore-manual/14-sync-realtime.md` and inspect `node_modules/@livestore/sync-cf` / `@livestore/adapter-web` (search for `syncPayload`) to answer: **is the payload read fresh on every (re)connect, or captured once at store creation?**

- If read fresh per connect (payload referenced at connect time): updating the `syncToken` prop is sufficient; proceed as written.
- If captured once at store creation: updating the prop does nothing for the live store. Then the refresh in Step 2 must store the fresh token where the payload getter can see it (e.g. a module-level ref read by a `syncPayload` getter) **if the API allows a function/getter**, otherwise STOP and report — forcing remounts every 45 minutes is NOT an acceptable fallback (it would drop in-flight UI state hourly).

Record the answer as a comment above `syncPayload` in `apps/web/src/livestore/index.tsx`.

**Verify**: the comment cites the file/line in the LiveStore source that consumes `syncPayload`.

### Step 2: Token refresh loop in `OrgProvider`

In `apps/web/src/context/org.tsx`, add one effect that keeps the token fresh while a `currentOrg` is set — modeled on `current-time.tsx`:

- Interval: refresh every **45 minutes** (token lives 60).
- Also refresh on `online` and on `visibilitychange` → `visible` (a laptop waking from overnight sleep holds an expired token; these listeners fix the common case immediately).
- Guard with a `cancelled` flag; clean up interval + listeners; re-run the effect when `currentOrg?.orgId` changes.
- On refresh failure (offline, 401): keep the old token and retry on the next trigger — do NOT clear `syncToken` (an expired token on a live socket is harmless; the socket stays up).
- Add the same `cancelled` guard to the existing bootstrap IIFE (lines 86–112) so a fast logout/login can't apply a stale user's org/token.

**Verify**: `pnpm --filter @asu/web build` → exit 0. Manual: in the dev app with all three services running, temporarily set the interval to 10 seconds, confirm via the network tab that `/api/sync-token?orgId=...` re-fires and sync continues working; restore 45 minutes afterwards (`grep -n "45" apps/web/src/context/org.tsx` shows the final value).

### Step 3: Never mount LiveStore without a token

- In `org.tsx`: `switchOrg` must not `setCurrentOrg` when `fetchSyncToken` returned null — surface a failure instead (see Step 4 state).
- In `_app.tsx`: replace the `syncToken!` assertion — render the loading state (or `OrgGate` fallback logic) until `syncToken` is a non-null string. The `currentOrg!` assertion is guarded by `OrgGate` today; make the token part of the same gate: `OrgGate` (in `org.tsx`) should require `currentOrg && syncToken` before rendering children.

**Verify**: `grep -n "syncToken!" apps/web/src` → no matches; build exits 0.

### Step 4: Distinguish "no orgs" from "orgs failed to load"

In `org.tsx`, add an `error: boolean` (or `"error" | "empty" | "ready"` status) to the context value: `refreshOrgs` currently returns `undefined` both when the fetch fails and, implicitly, can't distinguish an empty list. Bootstrap must set error state on `!res.ok`/throw, and `OrgGate` must render a retry UI for the error state instead of the create-org fallback. Keep the retry UI minimal and German (e.g. "Organisationen konnten nicht geladen werden." + "Erneut versuchen" button calling `refreshOrgs`) — follow the card styling used in `apps/web/src/routes/_authed/neue-organisation.tsx` for visual consistency.

**Verify**: build + lint exit 0. Manual: stop the auth worker, reload the app → retry UI appears (not a redirect to create-org); restart the worker, click retry → app loads.

## Test plan

If plans/001 landed, unit-test the pure decision logic by extracting it: a small helper (e.g. `shouldGateApp({ currentOrg, syncToken, error })` or the status reducer) in `org.tsx` or `apps/web/src/lib/`, with cases: ready, token-missing, error, empty-orgs. Full provider tests need a DOM harness — defer, note in report. The load-bearing verification here is the manual matrix in Steps 2–4.

## Done criteria

- [ ] `grep -rn '"1h"' apps/auth/src` still matches (server untouched)
- [ ] `grep -rn "syncToken!" apps/web/src` returns no matches
- [ ] Token refresh effect exists with interval + `online` + `visibilitychange` triggers and cleanup
- [ ] `OrgGate` blocks on missing token and renders a retry state on fetch error
- [ ] `pnpm --filter @asu/web build` and `pnpm --filter @asu/web lint` exit 0
- [ ] Step 1's findings documented as a comment in `apps/web/src/livestore/index.tsx`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Step 1 concludes the payload is snapshotted at store creation AND `syncPayload` cannot be a getter/function in `@livestore/react@0.3.1` — report the exact API surface; the fix then needs a LiveStore-level approach the advisor must re-plan.
- The retry UI requires routing changes beyond `_app.tsx`/`OrgGate` (e.g. new route files).
- You observe LiveStore remounting (loss of in-memory UI state) when only the token prop changes — that means `syncPayload` identity is keying something; investigate `useMemo` deps before proceeding, and report if unresolvable.

## Maintenance notes

- If the token TTL ever changes on the server, the 45-minute client interval must stay comfortably below it — consider deriving the interval from the JWT `exp` claim (decode without verify) as a follow-up.
- Reviewer: scrutinize effect cleanup (no duplicate intervals after org switches) and that refresh failures never null out a working token.
- Deferred: sync-worker-side "token expired" close-code handling with client-side re-auth push — needs LiveStore reconnect hooks not obviously exposed at 0.3.1.
