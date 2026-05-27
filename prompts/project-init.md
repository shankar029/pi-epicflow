---
description: One-time scaffold of the project-memory brain (`.pi/project/`) for this repo. Interviews the user for charter facts, writes the six artifact files from templates, updates root AGENTS.md to reference the index, and commits on a branch.
argument-hint: "[--auto-commit]"
---

You are running `/project-init`. Your job is to scaffold the
`project-memory` brain for this repo: `.pi/project/{index, charter,
conventions, decisions, backlog, sessions}.md`, plus wire it into the
root `AGENTS.md` so every future session reads the index first.

Optional args from the user: $@

- `--auto-commit` — skip the "ready to commit?" confirmation.

This is a one-shot. After it runs, the `project-memory` skill takes over
and writes to the brain autonomously.

## Pre-flight (BEFORE step 1)

1. **Check we're in a git repo.** `git rev-parse --is-inside-work-tree`.
   If not, abort with: *"`/project-init` needs a git repo. Run `git init`
   first."*
2. **Check `.pi/project/` doesn't already exist.**
   - If it does and has files, ASK: *"`.pi/project/` already exists with
     N files. Reinitialize (overwrite), refresh (only fill missing
     files), or abort?"* — wait for answer.
   - If it exists but is empty, continue.
3. **Find the pi-epicflow extension root** so you can copy templates.
   Try `~/.pi/agent/git/github.com/shankar029/pi-epicflow/templates/project/`
   first; fall back to `node_modules/pi-epicflow/templates/project/` if
   present. If neither exists, abort with a clear error.
4. **Check we're on a feature branch**, not the default branch. If on
   `main` / `master`, create a branch: `git checkout -b project/init`.

## Step 1 — Interview (4 questions, with recommended defaults)

Ask these in ONE message. Pair every question with a recommended default
the user can accept with "go with your recommendation".

```
I'll scaffold .pi/project/ for this repo. Four quick questions — each
has a recommended default you can accept with "go".

1. **One-sentence goal for this repo.**
   Recommend (inferred from README/package.json): "<your inferred goal>"
   Confirm, correct, or "go".

2. **Top 1–2 non-goals** (things this repo deliberately doesn't try).
   Recommend: "<inferred from scope of README + visible code>"
   Confirm or list yours.

3. **Quality bar shape:**
   - tests policy (recommend: "every public function has a unit test")
   - perf policy (recommend: "no n+1 queries; document any sync I/O on
     hot paths")
   - compat policy (recommend: "no breaking changes without semver
     major")
   Accept defaults with "go" or override individually.

4. **Primary user** (one name / role / persona).
   Recommend (inferred): "<inferred>"
   Confirm or correct.
```

Read these files BEFORE asking, to make the inferences credible:
- `README.md` (root)
- `package.json` / `pyproject.toml` / `Cargo.toml` / `go.mod` — whichever
  exists, for project name and description
- Top-level directory listing (`ls`)

If the inferences would be embarrassing (you don't have enough info),
ask without inferring.

## Step 2 — Write the artifacts

Copy each template from the extension's `templates/project/` to
`.pi/project/`, substituting placeholders:

| Template | Substitutions |
|---|---|
| `index.md` | `{{PROJECT_NAME}}`, `{{DATE}}` (today, YYYY-MM-DD) |
| `charter.md` | `{{PROJECT_NAME}}`, `{{DATE}}`, `{{ONE_SENTENCE_GOAL}}`, `{{NON_GOAL_1}}`, `{{NON_GOAL_2}}`, `{{TEST_POLICY}}`, `{{DOC_POLICY}}`, `{{PERF_POLICY}}`, `{{COMPAT_POLICY}}`, `{{PRIMARY_USER}}`, `{{DOWNSTREAM}}`, `{{DOCS_URL}}`, `{{ISSUE_TRACKER}}` |
| `conventions.md` | `{{DATE}}` |
| `decisions.md` | (no substitutions; leave as-is) |
| `backlog.md` | (no substitutions) |
| `sessions.md` | (no substitutions) |
| `gotchas.md` (v0.14+) | `{{DATE}}` |
| `questions.md` (v0.14+) | `{{DATE}}` |
| `modules/README.md` (v0.14+) | (no substitutions; informational) |
| `modules/_template.md` (v0.14+) | (no substitutions; user copies as `<name>.md` when authoring a card) |

For unknown fields (e.g. `{{DOCS_URL}}` if the user didn't give one),
leave a `_TBD_` marker — don't invent values.

**v0.14+ note:** the three Phase 2 artifacts (`gotchas.md`,
`questions.md`, `modules/`) are copied **only if they exist in the
extension's templates directory**. On older pi-epicflow installs that
predate v0.14, copy only the six Phase 1 templates and skip the rest
silently. On v0.14+, copy all of them.

## Step 3 — Wire into root `AGENTS.md` (preserve existing content)

**BL-005 hardening (v0.13.1):** This step is now strictly
append-only with safety backup. Never overwrite an existing
`AGENTS.md`.

Mechanical flow:

1. **Detect** — `Test-Path AGENTS.md` (or `[[ -f AGENTS.md ]]`).

2. **If `AGENTS.md` does NOT exist** — create a fresh one:

   ```md
   # Agent instructions — <repo-name>

   Read this first if you're an AI coding agent working on this repo.

   ## Project memory

   This repo uses [pi-epicflow](https://github.com/shankar029/pi-epicflow)'s
   project-memory pillar. Before answering non-trivial questions, read
   `.pi/project/index.md` and follow links to relevant artifacts. Write to
   `decisions.md` / `backlog.md` / `conventions.md` / `sessions.md`
   immediately when a triggering phrase appears (see the `project-memory`
   skill). Concrete implementations only — no stubs.
   ```

3. **If `AGENTS.md` exists** — do the **idempotent append** dance:

   a. **Search for the section first.** Look for an exact line
      `## Project memory` (heading level 2) anywhere in the file:

      ```bash
      grep -qE '^## Project memory\s*$' AGENTS.md && echo "already wired"
      ```

      ```powershell
      Select-String -Path AGENTS.md -Pattern '^## Project memory\s*$' -Quiet
      ```

      If the section already exists — **stop, do nothing, report**
      "AGENTS.md already wired (idempotent skip)." This is the case
      on every re-run of `/project-init`.

   b. **Take a safety backup** before any write — `cp AGENTS.md
      AGENTS.md.bak` (or `Copy-Item AGENTS.md AGENTS.md.bak`). If
      `AGENTS.md.bak` already exists, **do not overwrite it** — use a
      timestamped name `AGENTS.md.bak.<YYYYMMDD-HHMMSS>` instead.
      Print the backup path to the user so they can restore if
      anything goes wrong.

   c. **Append** the section to the END of the file, preserving every
      existing byte. Ensure the file ends with a newline first; then
      append a blank line + the section. Do NOT modify any existing
      headings, code blocks, or content.

      The exact block to append:

      ```md

      ## Project memory

      This repo uses [pi-epicflow](https://github.com/shankar029/pi-epicflow)'s
      project-memory pillar. Before answering non-trivial questions, read
      `.pi/project/index.md` and follow links to relevant artifacts. Write to
      `decisions.md` / `backlog.md` / `conventions.md` / `sessions.md`
      immediately when a triggering phrase appears (see the `project-memory`
      skill). Concrete implementations only — no stubs.
      ```

4. **Verify** — re-read `AGENTS.md` and confirm:
   - The pre-existing content is byte-identical to the backup
     (`diff AGENTS.md.bak AGENTS.md` should show only the appended
     section as a diff hunk, with no deletions).
   - Exactly one `## Project memory` heading exists
     (`grep -c '^## Project memory$' AGENTS.md` returns `1`).

5. **Report** to the user:
   - "Created `AGENTS.md`" (case 2), or
   - "Already wired — skipped" (case 3a), or
   - "Appended `## Project memory` to existing `AGENTS.md` (backup
     at `AGENTS.md.bak[.<stamp>]`)" (case 3b/c).

**Anti-patterns explicitly forbidden:**

- Do NOT use `write` (or `Set-Content` without `-Append`) on an
  existing `AGENTS.md`. Use `edit` to append, or shell append (`>>`).
- Do NOT rewrite the user's existing headings, even to "normalize"
  formatting. The user owns their `AGENTS.md`.
- Do NOT delete `AGENTS.md.bak` automatically. Leave it for the user
  to remove once they've verified the append.

## Step 4 — Open the first session entry

Append the very first session entry to `.pi/project/sessions.md`:

```md
## S-001 — Initialize project memory

**Date:** <today YYYY-MM-DD>
**Goal:** Scaffold `.pi/project/` and wire it into AGENTS.md.
**Status:** achieved
**Started from:** branch `project/init`
**Ended at:** <today YYYY-MM-DD>

**Summary:**
First session under the project-memory pillar. Created index, charter,
conventions (with C-001 anti-stub + C-002 append-only seeded),
decisions, backlog, sessions log. AGENTS.md updated to reference the
index.

**Decisions made:**
- (none beyond the scaffold itself)

**Backlog added:**
- (none)

**Conventions added/amended:**
- C-001 — Anti-stub rule seeded from template
- C-002 — Append-only rule seeded from template

**Files touched:**
- `.pi/project/index.md` (created)
- `.pi/project/charter.md` (created)
- `.pi/project/conventions.md` (created)
- `.pi/project/decisions.md` (created)
- `.pi/project/backlog.md` (created)
- `.pi/project/sessions.md` (created)
- `AGENTS.md` (created or appended)

**Open threads (carry into next session):**
- (none — next session can pick any goal)
```

## Step 5 — Validate

Re-read each file and verify:
- No `{{PLACEHOLDER}}` markers remain in the parts the user answered.
  Unknown fields may keep `_TBD_`.
- `index.md` references all five other artifacts.
- `conventions.md` has `## C-001` and `## C-002` filled in.
- `sessions.md` has the S-001 entry.

If any check fails, fix in place and re-validate.

## Step 6 — Commit

Show a brief summary of what was scaffolded:

```
Scaffolded .pi/project/ with 6 artifacts + S-001 opening entry.
AGENTS.md updated to reference the index.
Ready to commit on branch project/init?
```

If `--auto-commit` was passed, skip the confirmation.

On confirm (or auto-commit):
```bash
git add .pi/project/ AGENTS.md
git commit -m "chore(project-memory): scaffold .pi/project/ and reference from AGENTS.md"
```

Tell the user:
```
✅ Project memory initialized. Push the branch and open a PR when ready.
From now on, pi sessions in this repo will:
- read `.pi/project/index.md` on entry
- ask for a session goal on the first non-trivial turn
- log decisions / deferred work / sessions autonomously
- refuse stubs by default
- delegate substantive work to epicflow-* sub-agent personas

You don't need to invoke slash commands for routine memory writes.
```

## Anti-patterns

- Don't ask 10 questions. Four, batched, with recommended defaults.
- Don't invent values for unknown fields. Use `_TBD_`.
- Don't commit on the default branch — always a feature branch.
- Don't overwrite an existing `## Project memory` section in AGENTS.md.
- Don't skip Step 4. The S-001 entry is how every future session knows
  the brain has been initialized.
