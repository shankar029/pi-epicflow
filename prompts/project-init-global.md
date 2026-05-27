---
description: One-time scaffold of the cross-repo global brain at ~/.pi/global-memory/. Idempotent. Refuses to overwrite existing files. Run once per user account, not per repo.
argument-hint: ""
---

You are running `/project-init-global`. This is a **one-time, per-user**
setup that creates the cross-repo project-memory overlay at
`~/.pi/global-memory/`. It is unrelated to any specific repo.

The overlay is **opt-in**. Repos work fine without it; running this
prompt is appropriate when:

- The user is starting their second or third repo with pi-epicflow and
  has noticed they're re-stating the same conventions in each repo's
  `.pi/project/conventions.md`.
- The user explicitly asks for "things I always want pi to do" or
  "my personal coding preferences across all repos".

Per DEC-006 (in pi-epicflow's own brain), the global brain is a
**strictly additive overlay**: per-repo `.pi/project/` remains
canonical and wins on conflict.

## Pre-flight

1. Determine the user's home directory: `$HOME` (POSIX) or `$env:USERPROFILE`
   (Windows). Resolve `~/.pi/global-memory/`.
2. Check if `~/.pi/global-memory/index.md` already exists.

   - **If yes** — stop. Print:
     ```
     ~/.pi/global-memory/ is already initialized. Edit the files
     directly, or run /project-review with --global to audit.
     ```
     (Idempotent skip — matches the BL-005 / v0.13.1 `/project-init`
     hardening pattern.)
   - **If no** — proceed.

3. Confirm with the user before writing:
   ```
   I'll create ~/.pi/global-memory/ with 4 files:
     - index.md       (routing)
     - charter.md     (personal/team identity — optional)
     - conventions.md (cross-repo always/never rules)
     - decisions.md   (cross-repo decisions like "ruff+uv for Python")

   This affects pi sessions in EVERY repo (loaded after per-repo brain,
   per-repo always wins on conflict). Per DEC-006 in pi-epicflow.

   Proceed? (y/N)
   ```
   Wait for user confirmation. If "n" or anything but "y", stop.

## Step 1 — Find the pi-epicflow templates

Try `~/.pi/agent/git/github.com/shankar029/pi-epicflow/templates/global/`
first; fall back to `node_modules/pi-epicflow/templates/global/` if you
were installed via npm. Confirm `index.md`, `charter.md`,
`conventions.md`, `decisions.md` exist in the resolved directory.

If templates/global/ doesn't exist, the user's pi-epicflow install is
older than v0.14. Tell them:
```
pi-epicflow v0.14.0 or newer is required for the global overlay.
Run `pi install pi-epicflow` to upgrade.
```
and stop.

## Step 2 — Interview (light)

Before substituting, ask:

1. **Owner name** (for the charter header). E.g. "Shankar B." Default to
   `$USER` if the user shrugs.
2. **Do you want a charter file?** (charter.md is optional — it's
   personal-identity prose, not enforcement rules.)
   - "yes" → copy `charter.md` template with substitution
   - "no" → skip charter.md; remove its row from `index.md` after copy

Recommend "no" for a first-time setup — users typically don't have a
crisp personal charter on day 1 and end up filling it with platitudes.
They can `cp templates/global/charter.md ~/.pi/global-memory/` later.

## Step 3 — Copy templates with substitutions

For each template, copy from the pi-epicflow templates to
`~/.pi/global-memory/` and substitute:

| Template | Substitutions |
|---|---|
| `index.md` | `{{OWNER_NAME}}`, `{{DATE}}` |
| `charter.md` (optional) | `{{OWNER_NAME}}`, `{{DATE}}` |
| `conventions.md` | `{{DATE}}` |
| `decisions.md` | `{{DATE}}` |

If charter.md was skipped, edit the copied `index.md` to remove the
`<a id="charter"></a>` section + its row.

## Step 4 — Report

Print:

```
✅ ~/.pi/global-memory/ initialized.

Files created:
  ~/.pi/global-memory/index.md
  ~/.pi/global-memory/conventions.md
  ~/.pi/global-memory/decisions.md
  [~/.pi/global-memory/charter.md  ← if you said yes]

What happens next:
  - Future pi sessions in every repo will load this overlay AFTER the
    per-repo .pi/project/ brain.
  - Per-repo rules and decisions always win on conflict — pi will
    surface a one-line note when a per-repo entry overrides a global one.
  - To add a global rule, say "globally always X" or "across all my
    repos" or "in every Python project of mine" in any session — the
    project-memory skill will append a GC-NNN or GD-NNN entry here.
  - To audit / age-check the global brain, run /project-review --global.
```

## Anti-patterns (don't do this)

- **Don't** create `~/.pi/global-memory/sessions.md` or `backlog.md`.
  Those are inherently per-repo (per DEC-006).
- **Don't** seed conventions / decisions with content invented by you.
  This file is for the user's actual cross-repo patterns; let them
  accumulate naturally via trigger phrases.
- **Don't** overwrite an existing `~/.pi/global-memory/`. Stop and
  refer the user to manual editing (idempotent rule).
- **Don't** commit `~/.pi/global-memory/` to any repo. It's per-user,
  per-machine. If the user wants version control, they can `git init`
  inside the directory themselves.
