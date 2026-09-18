# Plan 006: Correct pause accounting and stop losing archived squads from the Einsatzverlauf

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ae62019..HEAD -- apps/web/src/livestore/schema/operation/squad.ts apps/web/src/components/operation/squads/card apps/web/src/livestore/queries/operation apps/web/src/components/operation/overview/event-log.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (touches the event schema — must follow the documented evolution rules exactly)
- **Depends on**: plans/001-verification-baseline.md (materializer test harness)
- **Category**: bug
- **Planned at**: commit `ae62019`, 2026-09-18

## Why this matters

Squad durations in this app are protocol data (Atemschutzüberwachung — the recorded times document respiratory-protection deployments). Three related defects corrupt them:

1. **Ending a paused squad loses the final pause**: the `squadEnded` event carries no pause info and the materializer never folds the in-progress pause into `totalPausedMs`, so the recorded Einsatzdauer is too long by the length of that last pause.
2. **The live "im Einsatz" clock ignores pauses entirely**: it shows `now - startedAt` even while paused and after resume, diverging from the (pause-corrected) final figure shown once the squad ends. The pressure prediction has the same wall-clock assumption plus a division-by-zero path.
3. **Archiving a squad erases its history from the Einsatzverlauf and the PDF export** on the next mount, because the event log iterates only non-archived squads. That is silent audit-trail loss.

## Current state

### Event schema and materializers — `apps/web/src/livestore/schema/operation/squad.ts`

```58:61:apps/web/src/livestore/schema/operation/squad.ts
  squadEnded: Events.synced({
    name: "v1.SquadEnded",
    schema: Schema.Struct({ id: Schema.String, endedAt: Schema.Date }),
  }),
```

```114:123:apps/web/src/livestore/schema/operation/squad.ts
  "v1.SquadEnded": ({ id, endedAt }) =>
    squadsTable.update({ endedAt, status: "ended" }).where({ id }),
  "v1.EndPressuresCompleted": ({ id, endPressuresCompletedAt }) =>
    squadsTable.update({ endPressuresCompletedAt }).where({ id }),
  "v1.SquadArchived": ({ id, archivedAt }) =>
    squadsTable.update({ archivedAt, status: "archived" }).where({ id }),
  "v1.SquadPaused": ({ id, pausedAt }) =>
    squadsTable.update({ status: "paused", pausedAt }).where({ id }),
  "v1.SquadResumed": ({ id, totalPausedMs }) =>
    squadsTable.update({ status: "active", pausedAt: null, totalPausedMs }).where({ id }),
```

The table has `totalPausedMs` (integer, default 0) and nullable `pausedAt` columns.

### Binding schema-evolution rules — `apps/web/livestore-migrations.md` (MUST follow)

> "Add optional fields to an existing event (with a default/fallback in the materializer)" is a **safe** change. Breaking changes (removing/renaming fields, changing types) are forbidden; they require a new versioned event. Table schema changes are always safe (tables rebuild from events).

Adding an **optional** `totalPausedMs` field to `v1.SquadEnded` is therefore the sanctioned mechanism. Old `squadEnded` events (without the field) must keep materializing exactly as today.

### End button — `apps/web/src/components/operation/squads/card/squad-actions/end-operation-button.tsx`

Receives only `squadId: string`; `handleEndOperation` (lines 20–30) commits `squadEnded({ id: squadId, endedAt: currentTime })` plus a log event. The paused-state end path uses this same button (`squad-actions/index.tsx` lines 30–39 render `<EndOperationButton squadId={squad.id} />` when `status === "paused"`; note it passes only the id — the component signature must change to receive the full `squad`).

### The client-side accumulation pattern to mirror — `resume-operation-button.tsx`

```21:33:apps/web/src/components/operation/squads/card/squad-actions/resume-operation-button.tsx
  const handleResumeOperation = () => {
    const pausedMs = squad.pausedAt
      ? currentTime.getTime() - squad.pausedAt.getTime()
      : 0;
    const newTotalPausedMs = (squad.totalPausedMs ?? 0) + pausedMs;

    store.commit(
      events.squadResumed({
        id: squad.id,
        resumedAt: currentTime,
        totalPausedMs: newTotalPausedMs,
      })
    );
```

### Live duration — `apps/web/src/components/operation/squads/card/stats.tsx`

Line 95: `{squad.startedAt ? duration(squad.startedAt, currentTime) : "00:00"}` — no pause subtraction. `predictedPressure` (lines 18–48) divides by a duration that can be zero (line 40: `barsPerMinute = (startPressure - latestPressure) / duration`) and also uses wall-clock time. The ended view (`ended-stats.tsx` lines 21–30) already subtracts `totalPausedMs` — that is the correct reference behavior.

### Archived squads dropped — `apps/web/src/livestore/queries/operation/squads.ts`

```4:8:apps/web/src/livestore/queries/operation/squads.ts
export const operationSquads$ = (operationId: string) => {
  return queryDb(tables.squads.where({ operationId, archivedAt: null }), {
    label: "operation-squads",
  });
};
```

`apps/web/src/components/operation/overview/event-log.tsx` uses this query (line ~84) to mount one `SquadLogCollector` per squad (line ~152) — archived squads get no collector, so their logs vanish from the Einsatzverlauf list and the PDF (`handleExportPdf` renders from the same `allEntries`). The Trupps board (`apps/web/src/components/operation/squads/overview.tsx`) uses the same query and **must keep excluding archived squads** — hence a new query, not a change to this one.

### Conventions

`duration()` helper in `apps/web/src/lib/duration.ts` takes `(earlierDate, laterDate)` and formats; queries live one-per-file under `apps/web/src/livestore/queries/operation/` with a `label`; commit style: short lowercase imperative.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Web build+typecheck | `pnpm --filter @asu/web build` | exit 0 |
| Web lint | `pnpm --filter @asu/web lint` | exit 0 |
| Web tests | `pnpm --filter @asu/web test` | all pass |
| Dev server | `pnpm --filter @asu/web dev` | serves on 60001 |

## Scope

**In scope** (the only files you should modify):
- `apps/web/src/livestore/schema/operation/squad.ts` (optional event field + materializer)
- `apps/web/src/components/operation/squads/card/squad-actions/end-operation-button.tsx`
- `apps/web/src/components/operation/squads/card/squad-actions/index.tsx` (pass `squad` instead of `squadId`)
- `apps/web/src/components/operation/squads/card/stats.tsx` (pause-aware duration + div-by-zero guard)
- `apps/web/src/livestore/queries/operation/squads.ts` (add `operationSquadsWithArchived$` alongside the existing query)
- `apps/web/src/components/operation/overview/event-log.tsx` (use the new query)
- `apps/web/src/livestore/schema/materializers.test.ts` (extend)

**Out of scope** (do NOT touch, even though they look related):
- `v1.SquadResumed`, `v1.SquadPaused` events and their materializers — correct as-is.
- `ended-stats.tsx` — already pause-correct; it is the reference, not a patient.
- `apps/web/src/components/operation/squads/overview.tsx` — the Trupps board must keep hiding archived squads.
- Whether pressure prediction should *freeze* during pause — product decision, deferred (see Maintenance notes). Only the div-by-zero guard and pause-aware elapsed time are in scope for `predictedPressure`.

## Git workflow

- Branch: `advisor/006-pause-math-and-archive-history`
- Commit per logical unit (schema, buttons, stats, event log); message style: short lowercase imperative, e.g. `fold final pause into squad end`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Extend `v1.SquadEnded` with an optional `totalPausedMs`

In `squad.ts`, change the event schema to:

```ts
squadEnded: Events.synced({
  name: "v1.SquadEnded",
  schema: Schema.Struct({
    id: Schema.String,
    endedAt: Schema.Date,
    totalPausedMs: Schema.optional(Schema.Number),
  }),
}),
```

Update the materializer so old events behave identically and new events settle the pause:

```ts
"v1.SquadEnded": ({ id, endedAt, totalPausedMs }) =>
  totalPausedMs === undefined
    ? squadsTable.update({ endedAt, status: "ended" }).where({ id })
    : squadsTable
        .update({ endedAt, status: "ended", totalPausedMs, pausedAt: null })
        .where({ id }),
```

The name stays `v1.SquadEnded` — per `livestore-migrations.md`, adding an optional field is non-breaking and does not need a v2 event.

**Verify**: `pnpm --filter @asu/web build` → exit 0. `pnpm --filter @asu/web test` → the plan-001 characterization case for pause→end now needs updating ONLY if it asserted materializer output for events carrying the new field — the old-event assertions must still pass unchanged.

### Step 2: Compute the final pause in the end button

Change `EndOperationButton` to accept `squad: Squad` (import the type like `resume-operation-button.tsx` does) instead of `squadId: string`, and update both render sites in `squad-actions/index.tsx` (`active` and `paused` branches) to pass `squad={squad}`. In `handleEndOperation`, mirror the resume math:

```ts
const pausedMs = squad.pausedAt
  ? currentTime.getTime() - squad.pausedAt.getTime()
  : 0;
const newTotalPausedMs = (squad.totalPausedMs ?? 0) + pausedMs;

store.commit(
  events.squadEnded({
    id: squad.id,
    endedAt: currentTime,
    totalPausedMs: newTotalPausedMs,
  })
);
```

(For a squad ended while `active`, `pausedAt` is null, so this commits the already-accumulated total — same result as before, now explicit.) Keep the confirm-button UX and the `squadLogCreatedWithText` commit unchanged.

**Verify**: build exits 0; `grep -n "squadId" apps/web/src/components/operation/squads/card/squad-actions/end-operation-button.tsx` → no matches.

### Step 3: Pause-aware live duration and safe pressure math in `stats.tsx`

- Compute effective elapsed time once:

```ts
const pausedSoFarMs =
  (squad.totalPausedMs ?? 0) +
  (squad.pausedAt ? currentTime.getTime() - squad.pausedAt.getTime() : 0);
const effectiveNow = new Date(currentTime.getTime() - pausedSoFarMs);
```

- Line 95 becomes `duration(squad.startedAt, effectiveNow)` (clamp: if `effectiveNow < startedAt`, show `"00:00"` — can happen only with clock skew).
- Pass `effectiveNow` (instead of `currentTime`) into `predictedPressure` so consumption time also excludes pauses.
- In `predictedPressure`, guard both divisions: if the computed `duration <= 0`, keep `barsPerMinute = defaultBarsPerMinute` and treat elapsed-since-log as 0 — never divide by zero or produce negative elapsed time.

**Verify**: build + lint exit 0. Manual: start a squad, pause ~30s, confirm the "im Einsatz" clock stands still during the pause and the ended figure matches the live figure at the moment of ending.

### Step 4: Event log includes archived squads

Add to `apps/web/src/livestore/queries/operation/squads.ts` (same file, new export):

```ts
export const operationSquadsWithArchived$ = (operationId: string) => {
  return queryDb(tables.squads.where({ operationId }), {
    label: "operation-squads-with-archived",
  });
};
```

In `event-log.tsx`, switch the `operationSquads$` usage to `operationSquadsWithArchived$` (import + call site — the collector mapping needs no other change). Do NOT touch other consumers of `operationSquads$`.

**Verify**: `grep -rn "operationSquads\$(" apps/web/src` → `event-log.tsx` no longer appears; only `overview.tsx` (Trupps board) and any pre-existing consumers remain. Manual: archive a squad with logs, reload the Einsatz Übersicht → its "Einsatz gestartet"/log entries still appear in the Einsatzverlauf and in the exported PDF.

### Step 5: Regression tests

Extend `apps/web/src/livestore/schema/materializers.test.ts` (pattern established by plan 001):

1. create → start → pause(t1) → end(t2, totalPausedMs = accumulated + (t2−t1)): row has `status: "ended"`, `pausedAt: null`, `totalPausedMs` equal to the carried value.
2. Legacy event: `squadEnded` **without** `totalPausedMs` → materializes exactly as before (status/endedAt set, `totalPausedMs` and `pausedAt` untouched) — this is the schema-evolution guarantee.
3. Multi-pause: pause → resume → pause → end; final `totalPausedMs` = sum of both pauses.

Update the plan-001 characterization case for pause→end: replace the `// current behavior — plan 006 changes this` assertions with the corrected expectations.

**Verify**: `pnpm --filter @asu/web test` → all pass including 3 new cases.

## Test plan

See Step 5 (store-level, the authoritative layer). Display math (`effectiveNow`, clamps) is verified manually in Step 3; if a DOM test harness exists by then, a unit test for a pure extracted `effectiveElapsed(squad, now)` helper is welcome but optional.

## Done criteria

- [ ] `v1.SquadEnded` schema has optional `totalPausedMs`; event name unchanged (`grep -n '"v1.SquadEnded"' apps/web/src/livestore/schema/operation/squad.ts`)
- [ ] Materializer handles both old (field absent) and new events; legacy test case passes
- [ ] `EndOperationButton` commits accumulated pause on end; receives `squad` prop
- [ ] Live "im Einsatz" duration subtracts pauses (frozen while paused)
- [ ] `predictedPressure` cannot divide by zero
- [ ] Einsatzverlauf + PDF include archived squads' history; Trupps board still hides archived squads
- [ ] `pnpm --filter @asu/web build`, `lint`, `test` all exit 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `Schema.optional(...)` on the event struct fails validation/typecheck in `@livestore/livestore@0.3.1` (the forces events at `apps/web/src/livestore/schema/force.ts:37-38` already use `Schema.optional(Schema.Date)`, so `Schema.optional(Schema.Number)` should work — if it doesn't, something is off; report).
- The materializer cannot express the conditional update (two branches) — check how other conditional materializers are written before reporting; do not fall back to raw SQL without reporting.
- Any existing test from plan 001 fails for a reason other than the intentional pause→end behavior change.
- The event-log change surfaces double entries (a collector remaining mounted for a squad that also re-appears) — report with the observed `entryGroups` keys.

## Maintenance notes

- Deferred product decision: whether **pressure prediction should freeze during a pause** (crew off-air vs. still consuming). Step 3 makes elapsed time pause-aware, which freezes the prediction implicitly — flag this in the PR description so the domain owner confirms it matches BOS practice.
- Historical data: squads ended-from-paused **before** this fix keep their inflated durations (their `squadEnded` events carry no pause data, and the event log is immutable). Any reporting built later must tolerate that.
- Reviewer: scrutinize the legacy-event materializer branch — it must be byte-equivalent in effect to today's behavior, or every client rematerializes different history.
