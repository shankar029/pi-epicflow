# Show HN / dev.to / social drafts — v0.14 + npm publish

For when you're ready to push. v0.13-era versions of this file are in
git history (`git show HEAD~N -- docs/announcements/social-drafts.md`).

The big narrative for v0.14 is **two shipments at once**:

1. **npm distribution** — `pi-epicflow` is now on the npm registry, so
   `pi install npm:pi-epicflow@^0.14` gives users auto-updates instead
   of `pi install git:github.com/shankar029/pi-epicflow` requiring
   manual re-installs.
2. **Cross-repo global overlay** — project memory matured from
   per-repo only into a layered global + per-repo system. Conventions
   you set once apply across all your repos.

Plus a quality-of-life cluster: in-site Quickstart, 9-page in-site Docs
reference, Worktree topology page, anti-EACCES + auto-clean install
fixes in v0.14.2.

Pick the shortest one that fits the venue.

---

## Show HN title (80 char limit)

```
Show HN: pi-epicflow v0.14 — multi-repo project memory for AI coding agents
```

(76 chars)

Alternates:
- `Show HN: AI coding agent that remembers across sessions AND across repos`
- `Show HN: File-based project brain for AI agents, now with cross-repo overlay`

## Show HN body

Hey HN — I posted v0.13 of pi-epicflow here a few weeks back (file-based
project memory for AI coding agents). v0.14 + npm distribution is out, and
the design has held up enough that I think it's worth a second post.

**What's new since v0.13:**

1. **Cross-repo global overlay.** v0.13's `.pi/project/` was per-repo only.
   Most operators run 3–5 repos in rotation, so personal conventions
   (`always use ruff over black`, `decisions about your auth stack`)
   got re-typed in every new repo. v0.14 adds a global overlay at
   `~/.pi/global-memory/` with two files (`global-conventions.md`,
   `global-decisions.md`) that get loaded on top of per-repo state.
   Per-repo entries always win on conflict. One slash command
   (`/project-init-global`) seeds it once per machine.

2. **npm distribution.** Was git-only. Now `pi install npm:pi-epicflow@^0.14`
   works → `pi update` keeps you current. Big distribution win.

3. **`epicflow-steward` persona.** Background sub-agent that mediates the
   global ↔ per-repo write boundary. When you say "always do X" in a
   session, the steward decides whether it belongs in the per-repo
   `conventions.md` (project-specific) or your global overlay
   (you'd want this in every repo). Asks if ambiguous.

4. **In-site reference docs** at https://shankar029.github.io/pi-epicflow/#/docs
   — 9 pages covering every nuts-and-bolt surface (commands, scripts,
   personas, brain artifacts, triggers, halt codes, install/config,
   worktree topology). Reading the README on GitHub no longer means
   leaving the project's actual page.

5. **Onboarding hardening (v0.14.2).** Doctor now proactively detects
   the npm-EACCES cliff that bites every Linux/WSL/macOS user with a
   root-owned global npm prefix; postinstall correctly resolves
   install-scope on plain npm-global layouts (was silently skipping
   `pi-subagents` auto-install on those paths).

**The v0.13 design principles still hold** after ~2 months of dogfooding:

- Trigger-moment writes, not end-of-session flushes
- Work-noun co-occurrence required (no false-positive "later" matches)
- Append-only with `supersedes` semantics
- Goal as guardrail, not gate
- C-001 anti-stub hard rule (no `TODO`/`FIXME`/`NotImplementedError`
  in shipped code, grep-enforced at reviewer gate)

**The thing I underestimated:** the global overlay's value is mostly
about you, not the project. Most of my conventions are "this is how
*I* code" not "this is what *this project* needs". Per-repo charters
stay tight; the overlay carries the operator's quirks across them.

Quickstart: https://shankar029.github.io/pi-epicflow/#/quickstart
Repo: https://github.com/shankar029/pi-epicflow
Release notes: https://github.com/shankar029/pi-epicflow/releases/tag/v0.14.2

Happy to answer questions about the global/per-repo merge semantics,
why the overlay is two files not six (it isn't a full second brain —
it's a personal-conventions layer), and how the steward persona
decides which file a new convention belongs in.

---

## Twitter / X thread (6 tweets)

**Tweet 1**
pi-epicflow v0.14 is out + we're finally on npm.

`pi install npm:pi-epicflow@^0.14`

Two months of dogfooding the project-memory pillar from v0.13 surfaced one big gap: per-repo only doesn't scale when you juggle 3-5 repos.

v0.14 fixes that. 🧵

**Tweet 2**
The fix: a global overlay at `~/.pi/global-memory/` with two files
• `global-conventions.md` — your always/never rules across every repo
• `global-decisions.md` — your stack-level choices

Loaded on top of per-repo state. Per-repo always wins on conflict. One slash command (`/project-init-global`) seeds it once per machine.

**Tweet 3**
What I underestimated:

Most of my "conventions" turned out to be about ME, not the project. "always use ruff over black", "prefer pathlib over os.path", "JSONL not SQLite for append logs". Project-specific stuff (the charter, the actual non-goals) is much smaller than I thought.

**Tweet 4**
New persona: `epicflow-steward`.

When you say "always do X" in a session, the steward decides:
- per-repo convention? → `.pi/project/conventions.md`
- personal preference? → `~/.pi/global-memory/global-conventions.md`

Asks if ambiguous. Logs the call in both files via `supersedes:` links.

**Tweet 5**
v0.14.2 (today) hardens the install path after a real smoke test caught 4 issues:
• EACCES detection in doctor before `pi update` hits it
• Auto-clean of pre-v0.4 stale skill tarballs
• Postinstall recognizes npm-global layouts (was silently skipping pi-subagents install)
• `.new` files surfaced by doctor

**Tweet 6**
Site got a Quickstart (https://shankar029.github.io/pi-epicflow/#/quickstart) and 9 pages of in-site reference docs (https://shankar029.github.io/pi-epicflow/#/docs).

Reading docs no longer means leaving the project's site for GitHub.

Repo: https://github.com/shankar029/pi-epicflow

---

## dev.to / Hashnode short post

**Title:** "Two months of file-based project memory for AI coding agents — what changed in v0.14"

Lede:

> v0.13 of pi-epicflow shipped a file-based project brain for AI coding
> agents (charter / conventions / decisions / backlog / sessions). Two
> months of dogfooding surfaced one big gap: per-repo only doesn't scale
> when you juggle 3–5 repos. v0.14 adds a global overlay and matures the
> design into a layered system.

Body: lift the Show HN body, add code samples for the global overlay
file format, link to the in-site Quickstart and the original
`blog-project-memory.md` (still accurate as the vendor-neutral
rationale).

**Tags:** ai, llm, devtools, productivity, opensource

---

## LinkedIn (paragraph form)

pi-epicflow v0.14 is out and now distributed via npm
(`pi install npm:pi-epicflow@^0.14`). The headline feature is a global
project-memory overlay at `~/.pi/global-memory/`: personal conventions
("always use ruff over black", "JSONL not SQLite for append logs") set
once apply across all your repos, while per-repo charters and decisions
stay project-specific. A new `epicflow-steward` persona mediates the
write boundary, deciding whether a new "always do X" rule belongs to
the project or to you. After two months of dogfooding the v0.13
per-repo design, the biggest surprise was how much of what I'd been
calling "project conventions" was actually personal preference — the
overlay carries those across repos so I stop re-typing them. New
in-site Quickstart and 9 pages of reference docs make first-time
onboarding much less of a "read three README sections then come back"
exercise.

Link: https://shankar029.github.io/pi-epicflow/#/quickstart

---

## Email to existing users / mailing list

**Subject:** pi-epicflow v0.14 — global overlay + npm distribution + Quickstart

Hi —

v0.14 series is out (v0.14.0 + v0.14.1 docs + v0.14.2 install hardening,
all rolled in). Two big shippables:

**1. Global project-memory overlay.** v0.13 was per-repo only, which
gets tedious when you run 3–5 repos in rotation. v0.14 adds
`~/.pi/global-memory/` (two files: `global-conventions.md` +
`global-decisions.md`) that get loaded on top of per-repo state. Set
your personal "always do X" rules once, apply everywhere. Per-repo
always wins on conflict. New `/project-init-global` slash command
seeds it once per machine.

**2. npm distribution.** Was git-only. Now:

```bash
pi install npm:pi-epicflow@^0.14    # auto-update on pi update
```

The git source still works as a fallback for unreleased commits.

**Smaller polish you'll notice:**

- `pi-epicflow-doctor` now proactively flags the `/usr/local` npm-prefix
  EACCES cliff (the one that breaks `pi update` for most Linux/WSL/macOS
  users on default node installs). Doctor prints the fix recipe inline.
- Postinstall now sweeps stale `epic-feature-workflow*.tar.gz` skill
  leftovers from pre-v0.4 installs.
- Postinstall correctly resolves install-scope on plain npm-global
  layouts (was silently skipping the auto-install of `pi-subagents` on
  those paths → mid-`/epic-run-auto` "subagent not found" errors gone).
- New in-site Quickstart: https://shankar029.github.io/pi-epicflow/#/quickstart
- New 9-page reference docs: https://shankar029.github.io/pi-epicflow/#/docs
  (commands / scripts / personas / brain artifacts / triggers / halt
  codes / install / worktree topology)

**No breaking changes.** v0.13 per-repo behavior is unchanged. Global
overlay is opt-in — don't run `/project-init-global` and nothing
changes for you.

Release notes:
- v0.14.0 — https://github.com/shankar029/pi-epicflow/releases/tag/v0.14.0
- v0.14.1 — https://github.com/shankar029/pi-epicflow/releases/tag/v0.14.1
- v0.14.2 — https://github.com/shankar029/pi-epicflow/releases/tag/v0.14.2

Thanks for shipping with this.

— Shankar
