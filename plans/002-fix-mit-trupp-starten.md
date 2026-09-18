# Plan 002: Make "Mit Trupp starten" actually create the first squad

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ae62019..HEAD -- apps/web/src/components/operation/new.tsx`
> If the file changed since this plan was written, compare the "Current state"
> excerpts against the live code before proceeding; on a mismatch, treat it as
> a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (Step 3's regression test requires plans/001; skip it with a note if 001 has not landed)
- **Category**: bug
- **Planned at**: commit `ae62019`, 2026-09-18

## Why this matters

The "Neuer Einsatz" card has two submit buttons: "Einsatz starten" and "Mit Trupp starten" (start with a first squad). The second one is broken: it sets React state in `onClick`, but the form's `onSubmit` handler fires in the same event dispatch with the **stale closure**, so `withFirstSquad` is still `false` on the click that submits. The operation is created without Trupp 1 and the user lands on an empty Trupps board. This is a core-flow bug in an emergency-operations app where the whole point of that button is speed.

## Current state

- `apps/web/src/components/operation/new.tsx` — the only file involved. The relevant wiring:

```23:23:apps/web/src/components/operation/new.tsx
  const [withFirstSquad, setWithFirstSquad] = useState<boolean>(false);
```

```54:79:apps/web/src/components/operation/new.tsx
    if (withFirstSquad) {
      store.commit(
        events.squadCreated({
          id: squadId,
          name: "Trupp 1",
          operationId,
          createdAt,
          status: "active",
          safetyTeam: false,
        })
      );
      store.commit(
        events.squadStarted({
          id: squadId,
          startedAt: currentTime,
        })
      );
      store.commit(
        events.squadLogCreatedWithText({
          id: crypto.randomUUID(),
          squadId,
          text: "Einsatz gestartet",
          timestamp: currentTime,
        })
      );
    }
```

```127:138:apps/web/src/components/operation/new.tsx
          <Button type="submit" className="w-full order-2">
            Einsatz starten
          </Button>
          <Button
            type="submit"
            variant="outline"
            className="w-full order-1"
            onClick={() => setWithFirstSquad(true)}
          >
            Mit Trupp starten
          </Button>
```

- `handleSubmit` signature: `(event: FormEvent<HTMLFormElement>) => void`, reads inputs via `new FormData(event.target as HTMLFormElement)`.
- Convention: UI copy is German; events come from `@/livestore/schema` and are committed with `store.commit(...)`; the `Button` component is shadcn (`apps/web/src/components/ui/button.tsx`) and forwards arbitrary button props.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck + build | `pnpm --filter @asu/web build` | exit 0 |
| Lint | `pnpm --filter @asu/web lint` | exit 0 |
| Tests (if 001 landed) | `pnpm --filter @asu/web test` | all pass |
| Dev server (manual check) | `pnpm --filter @asu/web dev` | serves on port 60001 |

## Scope

**In scope** (the only files you should modify):
- `apps/web/src/components/operation/new.tsx`
- `apps/web/src/components/operation/new.test.tsx` (create — only if plans/001 landed)

**Out of scope** (do NOT touch, even though they look related):
- `apps/web/src/livestore/schema/**` — no event or materializer changes; this is pure form wiring.
- `start-operation-form.tsx` and other squad-action components — different flow.

## Git workflow

- Branch: `advisor/002-fix-mit-trupp-starten`
- Single commit; message style: short lowercase imperative, e.g. `fix mit trupp starten squad creation`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Read the submitter instead of state

Remove the `withFirstSquad` state entirely. Identify which button submitted the form via the native submit event's `submitter`:

- Give the second button `name="with-squad"` and `value="true"` (keep `type="submit"`, drop the `onClick`).
- In `handleSubmit`, derive: `const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;` and `const withFirstSquad = submitter?.name === "with-squad";`
- Delete the `useState` line and the `onClick` prop. Everything inside the existing `if (withFirstSquad)` block stays identical.

Note: `FormData(form, submitter)` would also work, but reading `submitter` directly is the smaller change and keeps the existing `FormData` construction untouched.

**Verify**: `pnpm --filter @asu/web build` → exit 0; `grep -n "withFirstSquad" apps/web/src/components/operation/new.tsx` → only occurrences are the local `const` in `handleSubmit` and its use in the `if`.

### Step 2: Manual verification

Run `pnpm --filter @asu/web dev`, log in, and from the Einsätze overview:

1. Click "Mit Trupp starten" with a description filled → the Trupps page for the new Einsatz must show a card "Trupp 1" with status active and a log entry "Einsatz gestartet".
2. Create another Einsatz via "Einsatz starten" → Trupps page must be empty (no squad).

If you have no dev credentials/environment, state that in the report and rely on Step 3.

**Verify**: both behaviors observed (or explicitly reported as not manually verifiable).

### Step 3: Regression test (only if plans/001 landed)

`SubmitEvent.submitter` is browser behavior, so a store-level test can't cover the wiring end-to-end without a DOM. Add a component test only if `apps/web/vitest.config.ts` exists AND `@testing-library/react` + a DOM environment are already available; otherwise add the cheaper store-level guard: in `apps/web/src/livestore/schema/materializers.test.ts`, assert that the exact event sequence this button commits (`operationCreated` → `squadCreated` → `squadStarted` → `squadLogCreatedWithText`) materializes one operation with one active squad and one log row. If neither infra exists, skip with a note in the report and in `plans/README.md`.

**Verify**: `pnpm --filter @asu/web test` → all pass.

## Test plan

See Step 3. Happy path (with squad), negative path (without squad) covered manually in Step 2; the store-level sequence test guards the commit block's payload shape against regressions.

## Done criteria

- [ ] `pnpm --filter @asu/web build` exits 0
- [ ] `pnpm --filter @asu/web lint` exits 0
- [ ] `grep -n "setWithFirstSquad" apps/web/src/components/operation/new.tsx` returns no matches
- [ ] Manual check performed or explicitly reported as skipped
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `new.tsx` no longer matches the excerpts above (the two-submit-button layout was refactored).
- `event.nativeEvent` is not a `SubmitEvent` at runtime/type level in this React version — report rather than casting through `any` chains beyond the single documented cast.
- Fixing this appears to require changes to the `Button` UI component.

## Maintenance notes

- If a third submit variant is ever added, keep the pattern: distinguish by `submitter.name`, never by pre-submit state.
- Reviewer: confirm the `if (withFirstSquad)` commit block is byte-identical to before — this plan changes how the flag is derived, nothing else.
