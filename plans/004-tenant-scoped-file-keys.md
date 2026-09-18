# Plan 004: Enforce org membership on all R2 file keys

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat ae62019..HEAD -- apps/auth/src/routes/files.ts apps/web/src/lib/s3.ts apps/web/src/components/operation/overview/notes.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none (can land independently of 001–003)
- **Category**: security
- **Planned at**: commit `ae62019`, 2026-09-18

## Why this matters

The file API (`/api/files` on the auth worker) checks org membership **only for keys starting with `organizations/`**. Note attachments use keys like `operations/<operationId>/notes/<noteId>.<ext>`, which skip that check entirely: any authenticated user of ANY org can GET or PUT any `operations/*` object if they know or guess an operation id. That is a cross-tenant IDOR on operational attachments (photos, documents from real deployments), and PUT additionally allows overwriting another org's evidence files. The root cause is architectural: the operation→org mapping lives only in the client-side LiveStore event log, so the worker has nothing to authorize against. The fix is to put the orgId into the key path for new uploads and verify membership against it, while containing (not silently preserving) the legacy exposure.

## Current state

- `apps/auth/src/routes/files.ts` — the whole file API. Key validation and the org check today:

```8:14:apps/auth/src/routes/files.ts
const MAX_BYTES = 25 * 1024 * 1024;
const KEY_RE =
  /^(organizations|operations)\/[A-Za-z0-9._-]+\/[A-Za-z0-9._/-]+$/;

function isValidKey(key: string) {
  return KEY_RE.test(key) && !key.includes("..") && !key.endsWith("/");
}
```

```44:47:apps/auth/src/routes/files.ts
  if (key.startsWith("organizations/")) {
    const denied = await denyUnlessOrgMember(c, key.split("/")[1]!);
    if (denied) return denied;
  }
```

(The same conditional check appears in the GET handler at lines 69–72. `denyUnlessOrgMember(c, orgId)` at lines 16–27 queries the `membership` table by `orgId` + `userId` and returns a 403 response or null — reuse it.)

- `apps/web/src/lib/s3.ts` — client-side key builders and fetch helpers:

```82:94:apps/web/src/lib/s3.ts
export function noteAttachmentKey(
  operationId: string,
  noteId: string,
  fileName: string
): string {
  const ext = fileName.includes(".") ? fileName.split(".").pop() : "";
  return `operations/${operationId}/notes/${noteId}${ext ? `.${ext}` : ""}`;
}

export function orgLogoKey(orgId: string, fileName: string): string {
  const ext = fileName.includes(".") ? fileName.split(".").pop() : "";
  return `organizations/${orgId}/logo-${Date.now()}${ext ? `.${ext}` : ""}`;
}
```

- Callers of `noteAttachmentKey`: `apps/web/src/components/operation/overview/notes.tsx` (~line 40, builds the key before `uploadFile`). The **stored key string is persisted inside LiveStore note events** (immutable event log — old stored values can never be rewritten). Downloads go through `getDownloadUrl(stored)` → `extractKey(stored)` in the same `s3.ts`, which already normalizes several legacy formats (plain keys, old Hetzner/AWS URLs).
- Org id is available in the frontend via `useOrg()` from `apps/web/src/context/org.tsx` (`currentOrg.orgId`). The notes component can call that hook (check its imports; it's a client component under the org-gated app shell).
- The auth worker's session/user comes from `requireAuth` middleware (`apps/auth/src/middleware/auth.ts`); `c.get("user")` and `c.get("db")` are available in handlers.
- Event-schema rule that constrains this plan (from `apps/web/livestore-migrations.md`): events already written are immutable — any stored `operations/...` key strings in existing note events will remain in that form forever. New code must keep reading them.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Auth typecheck | `pnpm --filter @asu/auth typecheck` | exit 0 (script exists after plan 001; else `pnpm --filter @asu/auth exec tsc --noEmit`) |
| Web build | `pnpm --filter @asu/web build` | exit 0 |
| Web tests | `pnpm --filter @asu/web test` | all pass (if 001 landed) |
| Local workers | `pnpm --filter @asu/auth dev` | wrangler dev serves |

## Scope

**In scope** (the only files you should modify):
- `apps/auth/src/routes/files.ts`
- `apps/web/src/lib/s3.ts`
- `apps/web/src/components/operation/overview/notes.tsx` (pass orgId into the key builder)
- `apps/web/src/lib/s3.test.ts` (create, if plans/001 landed)

**Out of scope** (do NOT touch, even though they look related):
- The LiveStore note event schema (`apps/web/src/livestore/schema/operation/note.ts`) — the stored value stays a plain string key; no event versioning needed.
- Upload size/content-type enforcement (`MAX_BYTES`, `httpMetadata`) — separate finding (#14 in the audit), don't bundle it here.
- Any R2 bucket configuration or data migration of existing objects — operator territory; see report requirements below.
- `org-logo` flows — already correctly scoped under `organizations/<orgId>/`.

## Git workflow

- Branch: `advisor/004-tenant-scoped-file-keys`
- Commit per step; message style: short lowercase imperative, e.g. `scope note attachment keys by org`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: New org-scoped key format on the client

In `apps/web/src/lib/s3.ts`, change `noteAttachmentKey` to require the org id and emit the new prefix:

```ts
export function noteAttachmentKey(
  orgId: string,
  operationId: string,
  noteId: string,
  fileName: string
): string {
  const ext = fileName.includes(".") ? fileName.split(".").pop() : "";
  return `organizations/${orgId}/operations/${operationId}/notes/${noteId}${ext ? `.${ext}` : ""}`;
}
```

Update the caller in `notes.tsx` to pass `currentOrg.orgId` from `useOrg()`. `extractKey` needs no change (new values are plain keys, same as before). Reusing the existing `organizations/` prefix means the worker's existing membership check covers new uploads with **zero ambiguity about which path segment is the orgId** (`key.split("/")[1]`).

**Verify**: `pnpm --filter @asu/web build` → exit 0; `grep -rn "noteAttachmentKey(" apps/web/src` → every call site passes an orgId as first argument.

### Step 2: Lock down the legacy `operations/*` prefix on the worker

In `apps/auth/src/routes/files.ts`:

- **PUT**: reject any key that does not start with `organizations/` with `403 {"error":"Legacy key prefix is read-only"}`. (All new uploads use the Step 1 format; there is no legitimate new write under `operations/`.)
- **GET**: keep serving `operations/*` keys for now (existing note events reference them), but require an authenticated session as today AND add a response header `X-Legacy-Key: 1` so residual usage is observable in logs. Keep the `organizations/` membership check exactly as-is (it now also covers new note attachments).
- Tighten `KEY_RE` is NOT required (the `organizations/` branch already anchors the orgId segment); do not change it beyond what the PUT rejection needs.

**Verify**: auth typecheck exits 0; with `pnpm --filter @asu/auth dev` running, `curl -X PUT 'http://localhost:8787/api/files?key=operations/x/notes/y.png' -H 'Content-Type: image/png' --data 'x'` → 401 (no session — confirms route order still auths first). Code-review the handler to confirm the 403 branch precedes the R2 put.

### Step 3: Report the residual-risk inventory

The executor cannot migrate R2 objects (operator decision + production credentials). Instead, produce the inventory the operator needs: add to your final report the exact commands to run (read-only):

```
wrangler r2 object list asu-app --prefix operations/ --jurisdiction eu
```

and the recommendation: for each object, determine the owning org (via that org's note attachments in the app), copy to `organizations/<orgId>/operations/...`, and update nothing in the event log — instead extend `extractKey`/GET fallback mapping only if the operator chooses migration. Until migration, `operations/*` objects remain readable by any authenticated user (write-protected as of Step 2) — this residual risk must appear in the report and in `plans/README.md` notes.

**Verify**: report contains the inventory command and the residual-risk statement.

### Step 4: Unit tests for the key builders (if plans/001 landed)

Create `apps/web/src/lib/s3.test.ts`: `noteAttachmentKey` produces `organizations/<orgId>/operations/<opId>/notes/<noteId>.<ext>` (with and without extension); `extractKey` round-trips a plain new-format key unchanged, and still extracts keys from the three legacy stored formats documented in the `extractKey` comments (plain key, `/api/files`-style URL, path-style URL).

**Verify**: `pnpm --filter @asu/web test` → all pass.

## Test plan

Step 4 unit tests plus a manual end-to-end: upload a note attachment in the dev app, confirm the new key format lands in R2 (`wrangler r2 object list` against the local dev bucket or the network tab), and confirm the attachment re-downloads correctly. Negative test: a PUT with an `operations/...` key returns 403.

## Done criteria

- [ ] `noteAttachmentKey` emits `organizations/<orgId>/...` and all call sites pass orgId
- [ ] Worker PUT rejects non-`organizations/` keys with 403 (code inspection + curl where possible)
- [ ] Worker GET for `organizations/*` keys still enforces `denyUnlessOrgMember`
- [ ] `pnpm --filter @asu/web build` and auth typecheck exit 0
- [ ] Final report contains the legacy-object inventory command and residual-risk statement
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated (including the residual-risk note)

## STOP conditions

Stop and report back (do not improvise) if:

- `notes.tsx` cannot access `useOrg()`/`currentOrg` (e.g. it renders outside the org-gated shell) — report the component tree instead of threading orgId through props ad hoc.
- You find additional callers of `noteAttachmentKey` or other builders of `operations/*` keys beyond `notes.tsx` (`grep -rn "operations/" apps/web/src`) — list them; each needs the same treatment and may expand scope.
- Any test or manual check shows existing attachments failing to download after your change — GET behavior for legacy keys must be unchanged; revert and report.
- You are tempted to alter the note event schema or migrate R2 objects — both are out of scope.

## Maintenance notes

- Once the operator migrates legacy objects (or the org decides old attachments may expire), delete the `operations/*` GET branch and the `X-Legacy-Key` header — that is the moment the IDOR window fully closes. Track it as a follow-up.
- Reviewer: scrutinize the orgId path-segment parsing on the worker (`key.split("/")[1]`) — it must be the same segment the client writes, and the regex must keep forbidding `..`.
- Plan 014-style hardening (size enforcement, content-type allowlist) will touch the same handlers; rebase carefully if both are in flight.
