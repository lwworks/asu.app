# Plan 001: Establish a verification baseline (vitest, worker typechecks, CI)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ae62019..HEAD -- apps/web/package.json apps/auth/package.json apps/sync/package.json package.json apps/web/src/livestore apps/web/src/lib`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `ae62019`, 2026-09-18

## Why this matters

This repo has **zero tests, no CI, and no typecheck command for either Cloudflare Worker**. The only verification that exists is `tsc -b && vite build` inside the web app. The domain is emergency-operations protocol keeping (squad durations and timestamps are quasi-legal evidence), and the state layer is event-sourced (LiveStore): a bad materializer silently corrupts every org member's database on the next rebuild. Every other plan in `plans/` assumes this baseline exists — it is the prerequisite that makes the riskier fixes safe to execute and verify.

## Current state

- Monorepo layout: pnpm workspaces (`pnpm-workspace.yaml` lists `apps/*`, `packages/*`). Three apps: `apps/web` (`@asu/web`, React 19 + Vite 6 + LiveStore), `apps/auth` (`@asu/auth`, Cloudflare Worker: Hono + BetterAuth + D1/Drizzle), `apps/sync` (`@asu/sync`, Cloudflare Worker: Durable Objects). Shared types in `packages/shared` (`@asu/shared`).
- Root `package.json` has **no scripts at all**:

```1:5:package.json
{
  "name": "asu-app",
  "private": true,
  "packageManager": "pnpm@10.10.0+sha512.d615db246fe70f25dcfea6d8d73dee782ce23e2245e3c4f6f888249fb568149318637dca73c2c5c8ef2a4ca0d5657fb9567188bfab47f566d1ee6ce987815c39"
}
```

- `apps/web/package.json` scripts: `dev`, `build` (`tsc -b && vite build`), `lint` (`eslint .`), `preview`. No `test`, no vitest installed anywhere in the repo.
- `apps/auth/package.json` scripts: `dev`, `deploy`, `db:generate`, `db:migrate:local`, `db:migrate:prod`. No `typecheck`. `apps/sync/package.json` scripts: `dev`, `deploy` only. Both have a `tsconfig.json`.
- No `.github/` directory exists.
- LiveStore schema aggregation lives in `apps/web/src/livestore/schema/index.ts` and exports `tables`, `events`, and `schema` (built with `makeSchema({ events, state })`). Materializers are pure event→SQL mappings, e.g.:

```112:123:apps/web/src/livestore/schema/operation/squad.ts
  "v1.SquadStarted": ({ id, startedAt }) =>
    squadsTable.update({ startedAt, status: "active" }).where({ id }),
  "v1.SquadEnded": ({ id, endedAt }) =>
    squadsTable.update({ endedAt, status: "ended" }).where({ id }),
  "v1.EndPressuresCompleted": ({ id, endPressuresCompletedAt }) =>
    squadsTable.update({ endPressuresCompletedAt }).where({ id }),
  "v1.SquadArchived": ({ id, archivedAt }) =>
    squadsTable.update({ archivedAt, status: "archived" }).where({ id }),
  "v1.SquadPaused": ({ id, pausedAt }) =>
    squadsTable.update({ status: "paused", pausedAt }).where({ id }),
```

- Pure helpers worth first tests: `apps/web/src/lib/duration.ts` (HH:MM:SS formatting), `apps/web/src/lib/validate-time-input.ts`, `apps/web/src/lib/check-date-format.ts`, `apps/web/src/lib/clock-offset.ts` (server-time offset sampling; `measureOnce` computes `offset = data.now + rtt / 2 - t1`).
- The vendored LiveStore manual documents the store-level testing pattern: `livestore-manual/09-testing.md` — create an in-memory store with `makeAdapter({ storage: { type: "in-memory" } })` from `@livestore/adapter-node` + `createStorePromise({ schema, adapter, storeId })`, commit events, assert via `store.query(...)`. Use the app's real `schema` from `@/livestore/schema` rather than redefining tables.
- Repo conventions: TypeScript strict-ish, path alias `@/*` → `apps/web/src/*` (defined in `apps/web/tsconfig.app.json`), German domain vocabulary (Einsatz = operation, Trupp = squad). Commit style from `git log`: short lowercase imperative, e.g. `add org deletion`, `fix org logo upload`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install` | exit 0 |
| Web build+typecheck | `pnpm --filter @asu/web build` | exit 0 |
| Web lint | `pnpm --filter @asu/web lint` | exit 0 |
| Web tests (after this plan) | `pnpm --filter @asu/web test` | all pass |
| Auth typecheck (after this plan) | `pnpm --filter @asu/auth typecheck` | exit 0 |
| Sync typecheck (after this plan) | `pnpm --filter @asu/sync typecheck` | exit 0 |

## Scope

**In scope** (the only files you should modify/create):
- `apps/web/package.json` (add `test` script + vitest devDeps)
- `apps/web/vitest.config.ts` (create)
- `apps/web/src/lib/*.test.ts` (create)
- `apps/web/src/livestore/schema/materializers.test.ts` (create)
- `apps/auth/package.json`, `apps/sync/package.json` (add `typecheck` script)
- Root `package.json` (add aggregate scripts)
- `.github/workflows/ci.yml` (create)
- `pnpm-lock.yaml` (regenerated by install)

**Out of scope** (do NOT touch, even though they look related):
- Any file under `apps/web/src/components/`, `apps/web/src/routes/`, `apps/auth/src/`, `apps/sync/src/` — this plan adds verification, it does not fix bugs the tests may expose (record failures instead; see STOP conditions and Step 4).
- `apps/web/src/livestore/schema/**` source files — characterize current behavior, do not change it.
- ESLint/prettier config — formatting standardization is a separate concern.

## Git workflow

- Branch: `advisor/001-verification-baseline`
- Commit per step; message style: short lowercase imperative (e.g. `add vitest and lib unit tests`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add vitest to the web app

In `apps/web`, add devDependencies `vitest` (latest 3.x) and `@livestore/adapter-node` matching the existing `@livestore/*` version range (`^0.3.1` — must resolve to the same version as `@livestore/livestore`; check with `pnpm --filter @asu/web why @livestore/livestore`). Add script `"test": "vitest run"` (and `"test:watch": "vitest"`). Create `apps/web/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
```

**Verify**: `pnpm install` → exit 0, then `pnpm --filter @asu/web test` → "no test files found" is acceptable at this point (vitest exits non-zero on no tests; pass `--passWithNoTests` in the script: `"test": "vitest run --passWithNoTests"`).

### Step 2: Unit-test the pure time/date helpers

Create `apps/web/src/lib/duration.test.ts`, `check-date-format.test.ts`, `validate-time-input.test.ts`. Read each source file first and characterize its **current** behavior. Minimum cases:

- `duration(earlier, later)`: sub-hour renders `MM:SS`; over an hour renders `HH:MM:SS`; zero difference renders `00:00`; also record (as a test with a comment) what happens when `later < earlier` — characterize, don't fix.
- `checkDateFormat`: valid input format(s) it accepts and at least two rejects.
- `validate-time-input`: the midnight/rollover branch (input time later than now → interpreted as yesterday), plus `HH:mm` vs `HH:mm:ss` handling as implemented.

Use fixed `Date` values, no fake timers needed unless a helper calls `Date.now()` internally (then use `vi.useFakeTimers()` + `vi.setSystemTime(...)`).

**Verify**: `pnpm --filter @asu/web test` → all new tests pass.

### Step 3: Characterization tests for the squad materializers

Create `apps/web/src/livestore/schema/materializers.test.ts` using the in-memory store pattern from `livestore-manual/09-testing.md`, but importing the real app schema:

```ts
import { createStorePromise, queryDb } from "@livestore/livestore";
import { makeAdapter } from "@livestore/adapter-node";
import { schema, events, tables } from "@/livestore/schema";

const makeStore = () =>
  createStorePromise({
    schema,
    adapter: makeAdapter({ storage: { type: "in-memory" } }),
    storeId: `test-${crypto.randomUUID()}`,
  });
```

Commit event sequences and assert rows via `store.query(queryDb(tables.squads.where({ id })))` (match the query style in `apps/web/src/livestore/queries/operation/squads.ts`). Cases (all with fixed timestamps):

1. create → start: status `active`, `startedAt` set.
2. create → start → pause → resume: status `active`, `pausedAt` null, `totalPausedMs` equals the value carried in the `squadResumed` event.
3. create → start → end: status `ended`, `endedAt` set.
4. create → start → pause → end: **characterize current behavior** — today `pausedAt` stays set and `totalPausedMs` stays 0 (this is the bug fixed by plan 006; assert the current values and add a comment `// current behavior — plan 006 changes this`).
5. archive: status `archived`, `archivedAt` set.
6. force lifecycle: `forceCreated` → `forceUpdated` → `forceArchived` materialize as expected (see `apps/web/src/livestore/schema/force.ts`).

**Verify**: `pnpm --filter @asu/web test` → all pass, including ≥6 materializer cases.

### Step 4: Worker typecheck scripts

Add `"typecheck": "tsc --noEmit"` to `apps/auth/package.json` and `apps/sync/package.json`. Run each once. If pre-existing type errors surface, do NOT fix application code: record each error verbatim in your final report, and (only if needed to get a green baseline) exclude nothing — instead report and mark this plan BLOCKED for that worker.

**Verify**: `pnpm --filter @asu/auth typecheck` → exit 0 and `pnpm --filter @asu/sync typecheck` → exit 0 (or documented BLOCKED with the error list).

### Step 5: Root aggregate scripts

Add to root `package.json`:

```json
"scripts": {
  "typecheck": "pnpm --filter @asu/auth typecheck && pnpm --filter @asu/sync typecheck && pnpm --filter @asu/web build",
  "test": "pnpm --filter @asu/web test",
  "lint": "pnpm --filter @asu/web lint",
  "check": "pnpm lint && pnpm typecheck && pnpm test"
}
```

**Verify**: `pnpm check` from repo root → exit 0.

### Step 6: Minimal CI workflow

Create `.github/workflows/ci.yml`: trigger on `push` and `pull_request`; single job on `ubuntu-latest`; steps: checkout, `pnpm/action-setup` (version from root `packageManager` field), `actions/setup-node` (Node 22, `cache: pnpm`), `pnpm install --frozen-lockfile`, `pnpm check`.

**Verify**: `npx --yes yaml-lint .github/workflows/ci.yml` (or any YAML parse) → valid YAML. Actual CI run happens after push — out of your hands; note it in the report.

## Test plan

The tests ARE the deliverable — see Steps 2–3. Structural pattern: none exists in-repo yet; the materializer tests in Step 3 become the repo's exemplar and later plans reference them.

## Done criteria

- [ ] `pnpm check` exits 0 at repo root
- [ ] `pnpm --filter @asu/web test` runs ≥ 12 tests, all passing
- [ ] `apps/web/src/livestore/schema/materializers.test.ts` exists and covers the pause→end sequence (characterized)
- [ ] `pnpm --filter @asu/auth typecheck` and `pnpm --filter @asu/sync typecheck` exist and exit 0 (or BLOCKED report filed)
- [ ] `.github/workflows/ci.yml` exists and parses
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `@livestore/adapter-node` at the resolved `0.3.x` version fails to install or its in-memory adapter API does not match `livestore-manual/09-testing.md` (the manual may describe a newer version — report the actual exported API).
- Materializer tests reveal the store cannot be constructed in Node (e.g. OPFS/browser-only dependency pulled in transitively via `@/livestore/schema` imports). Report the import chain; do not stub modules.
- Worker typecheck surfaces more than 5 pre-existing errors in either worker.
- Any test you write fails against current behavior and you are tempted to change source code to make it pass — characterize instead, or report.

## Maintenance notes

- Plans 002–006 add regression tests into the files created here; keep `materializers.test.ts` organized by table (squads / forces) so they can append.
- Reviewer should scrutinize: that Step 3 asserts on *values* (timestamps, `totalPausedMs`), not just row existence; and that the pause→end case documents today's buggy behavior rather than asserting the desired one.
- Deferred: worker integration tests via `@cloudflare/vitest-pool-workers` (invite/JWT flows) — worth a follow-up plan once this baseline is green; e2e/browser tests are intentionally out.
