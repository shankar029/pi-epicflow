/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Complete end-to-end operator's manual for pi-epicflow as of v0.14.1.
 * Covers BOTH pillars (epic workflow + project memory) with the rationale
 * woven in so the process sticks. Uses a fictional through-line project
 * (`notesd`, a small notes daemon) so every concept lands on something
 * concrete.
 */

import { motion } from "motion/react";
import {
  Brain,
  FileCode,
  GitBranch,
  Flag,
  ShieldCheck,
  Workflow,
  Map,
  Compass,
  Layers,
  Wrench,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import {
  Prose,
  H2,
  H3,
  P,
  Strong,
  Em,
  Code,
  Ul,
  Ol,
  Li,
  Pre,
  Callout,
  Quote,
} from "./_typography";

const REPO = "https://github.com/shankar029/pi-epicflow";

export default function CompleteGuidePost() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <div className="inline-flex items-center gap-2 bg-vibrant-green/10 text-vibrant-green text-xs font-bold font-mono px-3 py-1 rounded-full border border-vibrant-green/20 mb-5 uppercase tracking-widest">
          <Workflow className="w-3 h-3" />
          Complete guide · v0.14.1
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
          pi-epicflow, <span className="text-vibrant-green">end&#x2011;to&#x2011;end</span>: a complete operator&apos;s guide
        </h1>
        <p className="text-text-muted text-lg leading-relaxed mb-6">
          Both pillars in one read. What each piece is, when to reach for it, and{" "}
          <Em>why</Em> the choice was made &mdash; so the workflow sticks in your head
          instead of being a checklist you re-look up every Monday. Follows a single
          fictional project, <Code>notesd</Code>, from empty directory through epic
          delivery through long-term brain maintenance.
        </p>
        <div className="text-sm text-text-muted/70 font-mono">
          2026-05-26 &middot; 28 min read
        </div>
      </motion.header>

      <Prose>
        <P>
          You can read the README and have a fuzzy picture. You can read the v0.13
          and v0.14 posts and understand the mechanics in isolation. Neither
          gives you the thing you actually need: an internalized sense of{" "}
          <Em>which lever to pull when</Em>, and the rationale behind each lever
          so you can recover when the docs aren&apos;t in front of you.
        </P>
        <P>
          That&apos;s what this post is for. By the end you&apos;ll have:
        </P>
        <Ul>
          <Li>A mental model of the two pillars and how they reinforce each other.</Li>
          <Li>A complete walkthrough of one project, from <Code>git init</Code> through three epics, with every command, every trigger phrase, and every artifact shown in context.</Li>
          <Li>The rationale for the eight design choices that most often confuse first-time readers.</Li>
          <Li>A take-home cheat sheet so you can stop re-reading the README.</Li>
        </Ul>

        <Callout kind="info" title="Prerequisites">
          You have pi (≥0.74) installed, you&apos;ve shipped at least one feature with
          an AI coding agent, and you know what a <Code>git worktree</Code> is. If
          you don&apos;t know what a worktree is, read{" "}
          <a className="text-vibrant-green hover:underline" href="https://git-scm.com/docs/git-worktree">git-worktree(1)</a>{" "}
          for two minutes first &mdash; everything in pillar 1 is built on it.
        </Callout>

        <H2 id="two-problems">The two problems pi-epicflow solves</H2>
        <P>
          One workflow, two pillars, two underlying problems. Internalize these
          as a paired diagnosis and the rest of the guide drops into place.
        </P>

        <div className="overflow-x-auto mb-6 rounded-2xl border border-slate-border">
          <table className="w-full text-sm">
            <thead className="bg-slate-surface/60">
              <tr className="text-left">
                <th className="p-3 font-semibold text-white">Problem</th>
                <th className="p-3 font-semibold text-white">Symptom</th>
                <th className="p-3 font-semibold text-white">Pillar</th>
              </tr>
            </thead>
            <tbody className="text-text-muted">
              <tr className="border-t border-slate-border">
                <td className="p-3"><Strong>Multi-feature work doesn&apos;t fit in one context.</Strong></td>
                <td className="p-3">5k-line PRs no one can review. Agent forgets feature 1 by the time it&apos;s on feature 8. Tests pass for the feature you&apos;re looking at and silently break the one three turns ago.</td>
                <td className="p-3"><strong className="text-vibrant-green font-semibold">Epic workflow</strong> (pillar 1)</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3"><Strong>Sessions don&apos;t remember each other.</Strong></td>
                <td className="p-3">Agent re-asks Tuesday&apos;s question on Wednesday. Re-decides parked items. Ships <Code>TODO</Code> stubs because nothing told it not to. Drifts off-goal because no goal was ever recorded.</td>
                <td className="p-3"><strong className="text-vibrant-green font-semibold">Project memory</strong> (pillar 2)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <P>
          The pillars are independent: you can adopt either one alone. They
          reinforce each other when used together &mdash; the epic workflow
          produces deviations and lessons that the brain captures; the brain
          provides conventions, decisions, and goals that every epic worker /
          reviewer primes on.
        </P>

        <H2 id="mental-model">The mental model: four phases of a project</H2>
        <P>
          Every project under pi-epicflow goes through the same four phases. Stick
          this in your head and 90% of &quot;which command do I run?&quot; resolves
          on its own.
        </P>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-surface/40 border border-slate-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Compass className="w-4 h-4 text-vibrant-green" />
              <span className="font-bold text-white text-sm">Phase 1 &mdash; Setup</span>
            </div>
            <P>One-time per machine, one-time per repo. Three commands total, none of them run again.</P>
          </div>
          <div className="bg-slate-surface/40 border border-slate-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-vibrant-green" />
              <span className="font-bold text-white text-sm">Phase 2 &mdash; Routine sessions</span>
            </div>
            <P>The brain grows passively. You don&apos;t invoke anything; trigger phrases produce entries automatically.</P>
          </div>
          <div className="bg-slate-surface/40 border border-slate-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-vibrant-green" />
              <span className="font-bold text-white text-sm">Phase 3 &mdash; Shipping an epic</span>
            </div>
            <P>Three commands: <Code>/epic-design</Code>, <Code>/epic-decompose</Code>, <Code>/epic-run-auto</Code>. Done in one sitting for small epics; resumable across days for big ones.</P>
          </div>
          <div className="bg-slate-surface/40 border border-slate-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-4 h-4 text-vibrant-green" />
              <span className="font-bold text-white text-sm">Phase 4 &mdash; Maintenance</span>
            </div>
            <P>Weekly-ish <Code>/project-review</Code>, optionally delegated to <Code>epicflow-steward</Code>. Catches drift, surfaces ripe items, suggests archive rollover.</P>
          </div>
        </div>

        <P>
          Notice what&apos;s <Em>not</Em> in any of those phases: ad-hoc
          documentation. No README updates as a separate ritual, no &quot;let
          me jot this down&quot; pause, no end-of-day notes routine. Everything
          you&apos;d normally do as a side activity is folded into a
          trigger-phrase the agent already watches for.
        </P>

        <Callout kind="info" title="Why four phases instead of one workflow">
          A workflow with twelve checkboxes is one you abandon by Wednesday.
          Four phases, each with at most three commands, fits in working
          memory. That&apos;s a deliberate design constraint &mdash; if a
          future feature can&apos;t be slotted into one of the existing four
          phases, it probably shouldn&apos;t exist.
        </Callout>

        <H2 id="through-line">The through-line: meet <Code>notesd</Code></H2>
        <P>
          To make the rest concrete, here&apos;s the project we&apos;ll follow
          for the entire post:
        </P>
        <Quote>
          <Strong><Code>notesd</Code></Strong> is a small note-taking daemon
          written in Python. It exposes an HTTP API
          (<Code>POST&nbsp;/note</Code>, <Code>GET&nbsp;/note/&lt;id&gt;</Code>,{" "}
          <Code>GET&nbsp;/notes?since=&lt;date&gt;</Code>), persists to JSONL
          on disk, and is meant to run as a single-user service on a
          laptop. Eventually it grows full-text search, an export command,
          and a small TUI client. Total project lifespan: about three months
          of evenings.
        </Quote>
        <P>
          That&apos;s typical &mdash; a 1500-line project, three or four major
          features, one person, no team. The exact scale pi-epicflow is built
          for. (Bigger? Same workflow scales. Smaller? Don&apos;t bother.)
        </P>

        <H2 id="phase-1">Phase 1 &mdash; Setup (three one-time commands)</H2>

        <H3 id="install">Step 1.1: install pi-epicflow</H3>
        <Pre>{`# Globally (writes to ~/.pi/agent/settings.json):
pi install npm:pi-epicflow

# Or pinned (recommended for now):
pi install npm:pi-epicflow@^0.14`}</Pre>
        <P>
          Postinstall does three things idempotently: registers the
          <Code>epic-feature-workflow</Code> and <Code>project-memory</Code> skills,
          symlinks the <Code>pi-epic-*</Code> and <Code>pi-feature-*</Code> CLI
          scripts into <Code>~/.local/bin</Code>, and copies all six{" "}
          <Code>epicflow-*</Code> agent personas into{" "}
          <Code>~/.pi/agent/agents/</Code>. It also auto-installs{" "}
          <Code>pi-subagents</Code> (required for auto-mode epics) and{" "}
          <Code>pi-intercom</Code> (optional, nicer prompts).
        </P>
        <Callout kind="info" title="Why one install gives you both pillars">
          The two pillars are <Em>distinct skills</Em>{" "}
          (<Code>epic-feature-workflow</Code> and <Code>project-memory</Code>) but
          they share infrastructure (the personas, the CLI helpers, the
          anti-stub convention). Bundling them in one extension means a single
          version pin covers everything, and the integration points (e.g.
          epic decomposition reading <Code>.pi/project/conventions.md</Code>)
          can&apos;t skew across versions.
        </Callout>

        <H3 id="init-global">Step 1.2: initialize the global overlay (once per user)</H3>
        <P>
          Optional but recommended if you work on more than one project:
        </P>
        <Pre>{`pi
you ▸ /project-init-global
pi  ▸ I'll create ~/.pi/global-memory/ with:
        - index.md       (routing)
        - conventions.md (cross-repo always/never)
        - decisions.md   (cross-repo defaults)
      Per-repo always wins on conflict. Proceed? (y/N)
you ▸ y
pi  ▸ Owner? (defaults to $USER)
you ▸ Shankar B.
pi  ▸ Charter file? (recommend "no" for first-time setup)
you ▸ no
pi  ▸ ✅ ~/.pi/global-memory/ initialized.`}</Pre>
        <P>
          The overlay starts empty. It fills naturally over weeks of work
          when you find yourself saying things like &quot;globally always
          use ruff for Python projects&quot; &mdash; that trigger phrase fires
          a <Code>GC-NNN</Code> write to the global overlay. Bare &quot;always
          do X&quot; without cross-repo framing still fires the per-repo
          trigger.
        </P>

        <Callout kind="info" title="Why per-repo wins on conflict">
          The repo is the authoritative context: every PR, every test
          run, every reviewer expectation lives inside it. A global rule
          can be a sensible default but cannot override what a specific
          project has explicitly decided. The agent surfaces a one-line
          <Code>Note: per-repo C-007 overrides global GC-003 (formatter: black vs ruff format)</Code>{" "}
          when it applies the per-repo rule, so the conflict is always
          visible rather than silently resolved.
        </Callout>

        <H3 id="init-repo">Step 1.3: bootstrap the project + initialize the brain</H3>
        <P>From an empty directory:</P>
        <Pre>{`mkdir notesd && cd notesd
git init && git checkout -b main
echo "# notesd" > README.md
git add . && git commit -m "initial commit"

pi
you ▸ /project-init
pi  ▸ [reads README — sparse; asks targeted questions]
      I'll scaffold .pi/project/ with 9 files. Quick interview:
        1. One-sentence goal? (will become charter.md goal line)
        2. Two non-goals you want to lock in?
        3. Quality bar — what makes you accept a PR?
      Anything not asked I'll leave as _TBD_ for you to fill in later.
you ▸ goal: notes daemon for personal use, HTTP+JSONL, single-user
      non-goals: multi-tenant, sync, mobile
      quality bar: pytest -q clean, ruff check clean, type-checks with mypy
pi  ▸ [drafts charter.md with substitutions]
      [writes conventions.md seeded with C-001 (anti-stub) and pi-epicflow defaults]
      [writes empty decisions.md, backlog.md, gotchas.md, questions.md]
      [writes sessions.md and opens S-001 with the stated goal]
      [writes index.md routing table; writes modules/ with README + _template.md]
      ✅ 9 brain files committed. S-001 opened.`}</Pre>

        <P>
          Three things to notice about that interview:
        </P>
        <Ul>
          <Li>
            <Strong>It asks for goals and non-goals first.</Strong> Non-goals
            are the cheapest reviewer; they catch scope drift before it
            starts.
          </Li>
          <Li>
            <Strong>It asks for a quality bar.</Strong> The quality bar
            becomes part of the system prompt for every future epic-reviewer
            pass. &quot;ruff check clean&quot; in the charter means every
            reviewer subagent will run that grep before approving.
          </Li>
          <Li>
            <Strong>It seeds <Code>C-001</Code> anti-stub by default.</Strong>{" "}
            You don&apos;t opt in. The convention is hard-coded into the
            template because it&apos;s the highest-value convention pi-epicflow
            has discovered across all dogfooding (see the v0.13 post for the
            full story).
          </Li>
        </Ul>

        <Callout kind="win" title="Setup is now permanently done">
          You will not run any of the three setup commands again on this
          machine or in this repo. Anyone re-running <Code>/project-init</Code>{" "}
          on a brain-already-present repo gets an idempotent skip. The setup
          phase is genuinely one-shot &mdash; no &quot;don&apos;t forget to
          run init after pulling&quot;, no migration scripts.
        </Callout>

        <H2 id="phase-2">Phase 2 &mdash; Routine sessions (the brain grows passively)</H2>
        <P>
          From here on, you use pi the way you already do. The{" "}
          <Code>project-memory</Code> skill autoloads in any repo with{" "}
          <Code>.pi/project/</Code>. Trigger phrases produce entries. You don&apos;t
          invoke <Em>any</Em> slash command in the routine flow.
        </P>

        <H3 id="first-session">A first real session on <Code>notesd</Code></H3>
        <P>
          Day 2. You sit down to write the storage layer.
        </P>
        <Pre>{`you ▸ pi
pi  ▸ [autoloads project-memory skill]
      [reads .pi/project/index.md → routing table says load charter + conventions]
      [reads ~/.pi/global-memory/index.md → loads GC + GD if any]
      [opens S-002 in sessions.md]

      Loaded: charter (3 non-goals, mypy/ruff/pytest quality bar),
              conventions (C-001 anti-stub + 2 pi-epicflow defaults).
              No global overlay rules apply (empty for now).

      What's the goal for S-002?

you ▸ implement storage layer — JSONL-on-disk, append-on-write,
      stream-on-read, single-file per day (notes-2026-05-26.jsonl).
      not bothering with locking yet — single-user assumption.

pi  ▸ Goal: implement JSONL storage layer with day-bucketed files,
      single-writer assumption (no locks for now). Recorded as S-002.

      I'll halt before unrelated work. Two questions before I start:
        1. Where on disk? \`~/.notesd/\` is conventional; or do you want
           to honor \`$XDG_DATA_HOME\` first?
        2. Schema? I'd suggest {id: uuid, ts: ISO-8601, body: str,
           tags: [str]} — anything to add or strip?

you ▸ XDG first, fall back to ~/.notesd/. Schema looks right but add
      "edited_at: ts | null" for future-edit support.

pi  ▸ Two design notes worth recording before code:

      Let's go with appending JSON-line-per-write over rewrite-whole-file —
      O(1) writes, no corruption window, trivially streamable.

you ▸ yes
pi  ▸ [writes DEC-001 to .pi/project/decisions.md]
        ## DEC-001 — Append-only JSONL storage
        **Decision:** one file per day, one JSON object per line,
          O_APPEND writes. No locks (single-user assumption).
        **Alternatives:** SQLite (rejected: overkill for single-user
          read patterns), full rewrite on write (rejected: corruption
          window).
        **Consequences:** edits become "soft" — original entry stays
          on disk, edit_at points at the latest version. Reader has
          to dedupe by id. That's fine for personal-use scale.

      And about edits: storing edited_at on the row creates the dedup
      requirement above. We're still deciding whether the reader's dedup
      is a feature or a footgun (some users may want to see edit history
      explicitly). Tracking as an open question.

you ▸ yeah I'm not sure yet — keep the dedup but flag it

pi  ▸ [writes Q-001 to .pi/project/questions.md]
        ## Q-001 — Expose edit history or silently dedupe?
        **Status:** open
        **Asked:** S-002 / 2026-05-26
        **Options:** (a) dedupe at read (current plan), (b) return all
          versions with edit_chain, (c) flag with ?versions=true query.
        **Revisit when:** first edit feature ships, or a user asks.

      [implements src/notesd/storage.py + tests/test_storage.py]
      [runs pytest -q → 7 tests pass]
      [runs ruff check . → clean; mypy --strict src → clean]

      One thing I tripped on: pytest's tmp_path fixture is per-test,
      so I had to set XDG_DATA_HOME explicitly in each test or storage
      would write to the real ~/.notesd during test runs. Worth a gotcha.

you ▸ definitely

pi  ▸ [writes G-001 to .pi/project/gotchas.md]
        ## G-001 — Storage tests must isolate XDG_DATA_HOME
        **Symptom:** tests run cleanly but ~/.notesd grows with junk.
        **Root cause:** storage layer reads XDG_DATA_HOME at import time;
          unset → falls back to ~/.notesd → tests pollute real dir.
        **Fix:** \`monkeypatch.setenv("XDG_DATA_HOME", str(tmp_path))\`
          in every storage test fixture.
        **Still applies if:** we keep XDG-first resolution (DEC-001).

      And a hygiene rule for the rest of the project:

you ▸ from now on, every test that touches the filesystem must isolate
      via tmp_path. I never want a test polluting ~

pi  ▸ [writes C-002 to .pi/project/conventions.md]
        ## C-002 — Tests that touch the filesystem must use tmp_path
        **Rule:** Never write to $HOME, $XDG_*, or any real path from
          a test. Use pytest's tmp_path + monkeypatch to isolate.
        **Enforcement:** reviewer grep for \`os.environ.get("HOME"\` or
          \`Path.home()\` in tests/ → flag.

      Goal achieved for S-002. Close?

you ▸ yes
pi  ▸ [closes S-002: status achieved, summary, files touched,
        promoted: DEC-001, Q-001, G-001, C-002]`}</Pre>

        <P>
          That&apos;s a 25-minute session. Four entries fired (one DEC, one Q,
          one G, one C). You wrote nothing in those files by hand. The brain
          grew because the trigger phrases happened to come up naturally in
          conversation &mdash; which they will, because they&apos;re the
          phrases you&apos;d use anyway.
        </P>

        <H3 id="trigger-rationale">Why trigger phrases (and not end-of-session summaries)</H3>
        <P>
          The single biggest design decision in project memory is{" "}
          <Em>when</Em> writes happen. There are three plausible options; only
          one survives contact with reality:
        </P>

        <div className="overflow-x-auto mb-6 rounded-2xl border border-slate-border">
          <table className="w-full text-sm">
            <thead className="bg-slate-surface/60">
              <tr className="text-left">
                <th className="p-3 font-semibold text-white">Approach</th>
                <th className="p-3 font-semibold text-white">Why it fails</th>
              </tr>
            </thead>
            <tbody className="text-text-muted">
              <tr className="border-t border-slate-border">
                <td className="p-3"><Strong>End-of-session summary</Strong></td>
                <td className="p-3">Sessions crash, run out of tokens, get interrupted. The summary never gets written. Decisions evaporate.</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3"><Strong>Daily batch dump</Strong></td>
                <td className="p-3">Loses the link between decision and the conversation that produced it. The agent can&apos;t recover &quot;why&quot; from a denormalized blob.</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3"><Strong>Trigger-moment writes</Strong></td>
                <td className="p-3">Survives crashes. Preserves context. Cost is ~3 lines of extra prompt vigilance from the agent. <strong className="text-vibrant-green font-semibold">This is what pi-epicflow does.</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <P>
          v0.13.2 formalized this as the <Strong>ASSUME INTERRUPTION</Strong>{" "}
          principle: treat every turn as potentially the last one before
          context resets. That&apos;s also why entries get IDs immediately
          (<Code>DEC-001</Code>) &mdash; if a follow-up reference needs to
          point at the decision, the reference is stable even if the session
          dies before its own summary lands.
        </P>

        <H2 id="phase-3">Phase 3 &mdash; Shipping an epic</H2>
        <P>
          Routine sessions handle &quot;one feature at a time&quot; work.
          Epics handle the case where you have a chunk of work that&apos;s
          5&ndash;20 features deep, has internal dependencies, and would
          produce an unreviewable PR if you did it in one go.
        </P>

        <P>
          For <Code>notesd</Code>, here&apos;s our first epic: shipping the HTTP
          API on top of the storage layer.
        </P>

        <H3 id="epic-design">Step 3.1: design</H3>
        <Pre>{`# In notesd repo, on main:
pi-epic-init 0001-http-api --from /tmp/http-api-design.md

# (Or, if you don't have a draft yet:)
pi-epic-init 0001-http-api

# Then open pi:
pi
you ▸ /epic-design
pi  ▸ [reads epic-config.yaml + any existing design.md draft]
      [reads .pi/project/charter.md, conventions.md, decisions.md]
      [reads any seed BRD if provided via --from]

      I'll co-author design.md in .pi/epics/0001-http-api/. Structure:
        §1 Problem  §2 Scope  §3 Non-scope  §4 Acceptance criteria
        §5 Open questions  §6 Risks

      Honoring from your brain:
        - charter non-goals: no multi-tenant, no sync, no mobile
        - DEC-001 (append-only JSONL)
        - C-001 (anti-stub) — auto-enforced
        - C-002 (test isolation) — applies to every test we add

      Draft the §1-§6 outline, or want to give me §1 yourself first?`}</Pre>

        <P>
          You iterate on the design with pi until you&apos;re happy. The design
          lives at <Code>.pi/epics/0001-http-api/design.md</Code> and is
          version-controlled. Spend 15&ndash;30 minutes here; it pays back
          tenfold downstream.
        </P>

        <Callout kind="info" title="Why design.md is committed before decomposition">
          The single biggest cause of bad epic decompositions is a fuzzy
          design. If <Code>§4 Acceptance criteria</Code> says &quot;HTTP API
          works&quot;, the decomposer will produce 12 features that overlap
          and conflict. If it says <Code>POST /note → 201 with id+ts; body in
          JSON; max 64 KB; rate-limit 100/s per process</Code>, the
          decomposer produces exactly the features that satisfy each
          bullet. Spend the time on the design.
        </Callout>

        <H3 id="epic-decompose">Step 3.2: decompose</H3>
        <Pre>{`you ▸ /epic-decompose
pi  ▸ [reads design.md + epic-config.yaml]
      [reads lessons.md to honor prior epic learnings]
      [proposes 5 features in YAML + ASCII dep graph]

      F01 http-server-skeleton ──┐
      F02 post-note-endpoint     ├── F04 list-notes-endpoint
      F03 get-note-endpoint     ──┘     │
      F02 post-note-endpoint    ────────┤
                                         ▼
                                  F05 integration-tests

      Each feature is ~30-60 min of work. F01 lays Flask routing scaffold;
      F02-F04 are independent endpoints (paralleled in auto mode);
      F05 wires up integration tests against a running server.

      Detected pyproject.toml → test_cmd: \`python -m pytest -q\`.
      Approve, or want me to re-decompose with different cuts?

you ▸ approved, write and commit

pi  ▸ [writes decomposition.yaml]
      [runs pi-epic-validate-decomposition → OK, DAG valid, 5 features,
        no scope-file collisions, integration shell present in F05]
      [git commit -m "decomp: 0001-http-api into F01..F05"]
      Committed as a83bc12. Next: /epic-run-auto.`}</Pre>

        <Callout kind="info" title="Why decomposition is committed to YAML, not chat">
          Three reasons. (1) It&apos;s the binding contract for what the
          epic will ship &mdash; if a worker drifts outside its declared
          <Code>scope_files</Code>, the reviewer halts. (2) It&apos;s
          diffable: if you revisit and want to re-decompose, the new
          version is a real diff against the old, not a vibes comparison.
          (3) It&apos;s machine-readable, which means <Code>pi-epic-status</Code>{" "}
          and <Code>pi-epic-run-auto</Code> can drive the loop without
          asking the agent to re-parse intent every turn.
        </Callout>

        <H3 id="epic-run">Step 3.3: run-auto</H3>
        <Pre>{`you ▸ /epic-run-auto
pi  ▸ ─── EPIC STATUS ───
      epic: 0001-http-api  branch: epic/0001-http-api
      phase: spawning F01
      ready: F01
      blocked: F02 (needs F01), F03 (needs F01), F04 (needs F02), F05 (needs F02,F03,F04)
      ───────────────────

      [spawns feature-planner subagent for F01 → produces plan.md]
      [spawns feature-worker subagent in ../notesd-F01 worktree off epic branch]
      [worker reads plan.md, design.md, .pi/project/charter+conventions]
      [worker writes Flask skeleton + tests]
      [worker self-checks: \`rg -nP '\\b(TODO|FIXME|XXX)\\b' src/\` → clean]
      [worker reports: 4 files added, 14 tests pass, 0 stubs]

      [spawns feature-reviewer subagent in ../notesd-F01]
      [reviewer reads design §4 ACs, conventions, plan.md, diff]
      [reviewer runs the test cmd; checks anti-stub grep; checks scope]
      [reviewer reports: APPROVE — 4/4 ACs met, scope clean, no stubs]

      [pi-feature-complete F01 → squash-merges into epic/0001-http-api,
        deletes branch + worktree, archives feature artifacts]

      ─── EPIC STATUS ───
      phase: spawning F02 and F03 in parallel
      done: F01 ✓
      ready: F02, F03
      ───────────────────

      [...repeats for F02-F05, in dependency order; parallel where possible...]

      [pi-feature-epic-reviewer subagent — reviews cumulative diff against
        epic-wide design.md, not feature-by-feature]
      [reviewer reports: APPROVE_EPIC — all ACs met, no scope drift, no
        cross-feature regressions]

      [pi-epic-complete → rebases epic onto current main, distills
        deviations.md → lessons.md, pushes branch, prints gh pr create cmd]

      Epic 0001-http-api complete. PR command:
        gh pr create --base main --head epic/0001-http-api \\
          --title "0001-http-api" --body-file .pi/epics/0001-http-api/pr-body.md`}</Pre>

        <P>
          That&apos;s ~25 minutes wall-clock for 5 features, depending on
          test-run cost. You looked at the screen twice &mdash; once to
          approve the decomposition, once to run the PR command.
        </P>

        <H3 id="why-subagents">Why fresh-context subagents per feature</H3>
        <P>
          The single biggest accelerator in this design. Three things become
          possible only because each feature runs in its own context:
        </P>
        <Ol>
          <Li>
            <Strong>Token budget stays bounded.</Strong> F05&apos;s worker
            doesn&apos;t have F01&apos;s 80 KB of file content competing for
            attention. The worker reads only F05&apos;s scope, its plan, and
            the shared design + brain primers.
          </Li>
          <Li>
            <Strong>Parallelism is free.</Strong> F02 and F03 are independent
            in the DAG; they run concurrently in separate worktrees. Eight
            features deep, this is the difference between 4 hours wall-clock
            and 90 minutes.
          </Li>
          <Li>
            <Strong>Worker failure is contained.</Strong> If F03 hangs or
            produces garbage, you can halt just F03, fix the plan, and re-run
            it. The other features keep their state.
          </Li>
        </Ol>

        <Callout kind="info" title="Why isolated worktrees and not just branches">
          Branch-switching mid-edit is the most reliable way to corrupt an
          agent&apos;s mental state of the codebase. A worker on F03 with
          uncommitted edits in <Code>src/api.py</Code> that gets <Code>git
          stash</Code>ed because F04 needs to start? That&apos;s a
          guaranteed scope leak or merge confusion. Separate worktrees
          mean every worker sees a clean checkout of the epic branch and
          can only see its own diff. Costs ~50 MB of disk; saves you from
          most of the &quot;why did the agent edit a file in F03 that F02
          owned?&quot; class of bugs.
        </Callout>

        <H3 id="halt">When things go wrong: halt codes</H3>
        <P>
          The whole pipeline halts explicitly rather than guessing. Eleven
          halt codes cover the failure modes:
        </P>
        <div className="overflow-x-auto mb-6 rounded-2xl border border-slate-border">
          <table className="w-full text-sm">
            <thead className="bg-slate-surface/60">
              <tr className="text-left">
                <th className="p-3 font-semibold text-white">Code</th>
                <th className="p-3 font-semibold text-white">Means</th>
              </tr>
            </thead>
            <tbody className="text-text-muted">
              <tr className="border-t border-slate-border">
                <td className="p-3 font-mono">H1</td>
                <td className="p-3">Design has unresolved <Code>§5 open question</Code> &mdash; can&apos;t decompose.</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3 font-mono">H2</td>
                <td className="p-3">Worker would touch a file outside declared scope.</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3 font-mono">H3</td>
                <td className="p-3">Reviewer NEEDS_CHANGES &mdash; worker has to re-loop (auto-retried once, then halt).</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3 font-mono">H4</td>
                <td className="p-3">Tests fail; not a known-flaky pattern.</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3 font-mono">H6</td>
                <td className="p-3">Two parallel workers want the same file. Pre-checked from scope; rare.</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3 font-mono">H7</td>
                <td className="p-3">Worker hit anti-stub self-check failure &mdash; shipped a TODO. Halts before merge.</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3 font-mono">H11</td>
                <td className="p-3">Optional E2E gate failed at <Code>pi-epic-complete</Code> time (v0.10+).</td>
              </tr>
            </tbody>
          </table>
        </div>
        <P>
          On halt, the orchestrator writes a halt report to{" "}
          <Code>.pi/epics/&lt;id&gt;/halt.md</Code>, prints what to do, and{" "}
          <Em>stops</Em>. It does not guess. You fix the underlying issue
          (clarify the design, expand the scope, fix the broken test) and
          re-run <Code>/epic-run-auto</Code> &mdash; it resumes from where
          it halted, not from the start.
        </P>

        <Callout kind="info" title="Why halt and not retry-with-different-prompt">
          Coding agents fail in two distinct ways: <Em>guessable</Em>{" "}
          failures (a transient network error; a flaky test) and{" "}
          <Em>specification</Em> failures (the design didn&apos;t say what to
          do here). Retry-with-prompt-tweak fixes the first and silently
          papers over the second. Halt-and-report forces the second class
          into your awareness, where it can be fixed properly in the
          design. After ~30 epics, the &quot;specification gap&quot; halt
          mode has produced more lessons than every other failure mode
          combined.
        </Callout>

        <H2 id="phase-4">Phase 4 &mdash; Living with both pillars</H2>
        <P>
          Two months in. <Code>notesd</Code> has shipped three epics. The brain
          has thirty-something entries. Here&apos;s what a typical week
          looks like.
        </P>

        <H3 id="typical-day">A typical day</H3>
        <Pre>{`you ▸ pi
pi  ▸ [loads brain via routing table — charter + conventions + 2 stale
        items routing table flagged]
      Note: BL-007 (full-text-search) referenced in S-018 and S-020.
            This is the 3rd cross-session reference — ripe for promotion
            to an epic. Want me to flag it for /project-review?

you ▸ yeah flag it but not now. let's work on the export command today.
      I'm thinking ndjson out by default, with --format=csv as an alt.

pi  ▸ Goal: export command, ndjson default, --format=csv supported.
      Recorded S-022.

      Quick check: this touches storage.read_all() — DEC-001 says reader
      has to dedupe by id, which depends on Q-001 (still open). For
      export, do you want all versions or just the latest? Q-001's
      resolution maps directly here.

you ▸ ah good catch. let's just export latest for now and resolve Q-001
      that way: dedupe at read, never expose history.

pi  ▸ [appends DEC-007 to decisions.md — "Resolve Q-001 by dedupe-at-read"]
      [flips Q-001 in questions.md to resolved (see DEC-007)]

      Implementing export now.
      [...]
`}</Pre>

        <P>
          Three things that worked there:
        </P>
        <Ul>
          <Li>
            <Strong>The agent surfaced a ripeness signal</Strong> from the
            brain without you asking. It&apos;s seen BL-007 referenced three
            times across sessions and flagged it. (This is{" "}
            <Code>/project-review</Code>&apos;s A-2 audit running passively.)
          </Li>
          <Li>
            <Strong>The agent caught a cross-reference</Strong>: today&apos;s
            export work depends on the still-open Q-001. Without the brain,
            you&apos;d ship an export that didn&apos;t match whatever Q-001
            eventually resolved to.
          </Li>
          <Li>
            <Strong>The Q-001 → DEC-007 resolution happened in one turn</Strong>,
            with both writes &mdash; the new DEC and the status-flip on Q-001
            &mdash; happening on the same turn. This is the only non-append
            edit allowed in the brain.
          </Li>
        </Ul>

        <H3 id="when-routine">When the routine flow is enough</H3>
        <P>
          You don&apos;t need an epic for:
        </P>
        <Ul>
          <Li>Single-file features (the export command above).</Li>
          <Li>Bug fixes that touch one or two files.</Li>
          <Li>Refactors localized to one module.</Li>
          <Li>Doc updates.</Li>
        </Ul>
        <P>
          The threshold is roughly &quot;would I split this into 3+ commits
          if I were doing it manually?&quot; &mdash; if yes, it&apos;s an epic;
          if no, just work in the main session.
        </P>

        <H2 id="phase-5">Phase 5 &mdash; Maintenance (weekly)</H2>
        <P>
          Sunday evening. You haven&apos;t touched the brain manually since
          the project started, but it&apos;s grown. Time for the only
          recurring command in pi-epicflow:
        </P>

        <Pre>{`pi
you ▸ /project-review
pi  ▸ Run interactively, or delegate to epicflow-steward? Delegation is
      recommended if you'll be doing brain hygiene across multiple repos
      this session.

you ▸ delegate

pi  ▸ [subagent → epicflow-steward primes on brain + global overlay]
      [steward runs A-0..A-8 audits — read-only]
      [steward returns Steward Report template]

      Steward report — notesd @ main
      Findings:
        A-1 Staleness: 1 stale (charter.md last_verified=2026-04-12)
        A-2 Backlog ripeness: 1 ripe (BL-007 full-text-search — 3 cross-
            session refs in S-018/S-020/S-022)
        A-3 Convention drift: none
        A-6 Module coverage: 2 modules without cards (storage/, api/)
        A-7 Index staleness: index.md last_verified ≥ 2 weeks behind
            file mtimes for decisions.md and conventions.md
        A-8 Capacity: backlog at 18/200, decisions at 7/500 — well
            under caps

      Recommendations (no edits made):
        1. Promote BL-007 → /epic-design 0002-full-text-search
        2. Refresh charter.md last_verified after re-reading
        3. Author module cards for storage/, api/ (3rd session each)
        4. Update index.md last_verified rows

      Edits made: none — read-only sweep.

you ▸ approved 1 and 4 for now, I'll do 2 and 3 myself

pi  ▸ [main session takes over — steward done]
      [I (main agent) run /epic-design 0002-full-text-search per rec 1]
      [I update index.md last_verified rows per rec 4]
      Done. Resume normal work, or close session?`}</Pre>

        <P>
          The pattern: steward audits (read-only, safe to delegate), main
          agent acts on recommendations. You stay in the loop for decisions;
          the agents do the legwork.
        </P>

        <Callout kind="info" title="Why steward has a hard write-allowlist">
          The failure mode it prevents: you ask the steward to audit brain
          drift, it flags &quot;G-007 mentions a footgun in src/auth.py but
          the auth module was deleted in F12&quot;, the main agent (without
          the allowlist) would helpfully &quot;clean that up&quot; by editing
          the source. Now you have a sweep diff that includes a code
          change you didn&apos;t review. The steward&apos;s write-allowlist
          (<Code>.pi/project/*.md</Code>, <Code>~/.pi/global-memory/*.md</Code>,
          archive files) makes this impossible. If the steward thinks code
          needs to change, it surfaces a recommendation and refuses to do
          it itself.
        </Callout>

        <H3 id="rollover">When the brain grows past its caps</H3>
        <P>
          Six months in, after twelve epics, <Code>decisions.md</Code> hits
          500 entries. <Code>/project-review</Code>&apos;s A-8 audit flags it:
        </P>
        <Pre>{`A-8 Capacity caps:
  decisions.md: 503/500 entries (over cap)
  Recommended rollover:
    1. Choose cutoff entry id (suggestion: DEC-432, last entry from
       v0.5 milestone — clean semantic boundary).
    2. git mv decisions.md decisions-archive-2026-h1.md
    3. Create fresh decisions.md with header + entries from DEC-433
       onward.
    4. Add archive row to .pi/project/index.md.
    5. git commit -m "chore: rollover decisions.md → archive-2026-h1"

  Stable ids never recycle. Cross-references like S-014 → DEC-021 stay
  valid forever — the agent's routing table tells future sessions
  to grep the archive when an id isn't in the live file.`}</Pre>

        <P>
          The rollover is <Em>always manual</Em>. The agent prints the
          recipe; you confirm. There is no automatic archive cron.
        </P>

        <Callout kind="info" title="Why manual rollover">
          An automatic rollover that picks the wrong cutoff (mid-version,
          mid-discussion, in the middle of a still-active decision thread)
          would silently bury entries the next session needs. Manual
          rollover with the agent suggesting a cutoff means you can sanity-
          check the boundary against your own sense of &quot;what era of
          the project ended where.&quot; The 30-second human step
          eliminates the entire class of &quot;why can&apos;t the agent find
          DEC-432?&quot; bugs.
        </Callout>

        <H2 id="rationale-recap">The rationale recap: eight design choices to remember</H2>
        <P>
          If you remember nothing else from this post, remember the
          rationale behind these eight choices. They explain 90% of why
          pi-epicflow looks the way it does.
        </P>

        <Ol>
          <Li>
            <Strong>Trigger-driven brain writes, not end-of-session summaries.</Strong>{" "}
            Sessions crash; trigger-moment writes survive. <Em>ASSUME INTERRUPTION.</Em>
          </Li>
          <Li>
            <Strong>Append-only with supersedes.</Strong> The history of how
            a project changed its mind is as valuable as the current state.
            Reversals are new entries, not deletes.
          </Li>
          <Li>
            <Strong>Stable IDs that never recycle.</Strong> Cross-references
            survive forever, even across archive rollovers. Future grep
            for <Code>DEC-021</Code> always lands on the right thing.
          </Li>
          <Li>
            <Strong>Per-repo brain wins over global overlay on conflict.</Strong>{" "}
            The repo is the authoritative context. Global is a default
            preference, not an override.
          </Li>
          <Li>
            <Strong>Decomposition is YAML, not chat.</Strong> Binding
            contract. Diffable. Machine-driven. Approved once, then
            enforced by every downstream subagent.
          </Li>
          <Li>
            <Strong>Worktree-per-feature, not branch-per-feature.</Strong>{" "}
            Branch-switching mid-edit is the most reliable corruption
            vector. Worktrees give every worker a clean checkout it can
            see only its own changes against.
          </Li>
          <Li>
            <Strong>Halt explicitly, don&apos;t retry-with-different-prompt.</Strong>{" "}
            Specification gaps need to surface, not get papered over. Halt
            codes are the project&apos;s lesson-distillation pipeline.
          </Li>
          <Li>
            <Strong>Anti-stub C-001 is hard-coded into every persona&apos;s contract.</Strong>{" "}
            &quot;Looks done, isn&apos;t&quot; is the worst failure mode of
            agentic coding. Worker self-check + reviewer grep gate
            eliminate ~90% of it.
          </Li>
        </Ol>

        <H2 id="when-not">When NOT to use pi-epicflow</H2>
        <P>
          This is overkill for:
        </P>
        <Ul>
          <Li>One-off scripts you&apos;ll throw away within 48 hours.</Li>
          <Li>Projects with one feature, one commit, one PR.</Li>
          <Li>Read-only workflows (audits, code review without changes).</Li>
          <Li>Multi-user concurrent epic work (no locking on <Code>.pi/epics/&lt;id&gt;/</Code>).</Li>
          <Li>Cross-repo refactors (the workflow is single-repo by design).</Li>
        </Ul>
        <P>
          It earns its keep when you have:
        </P>
        <Ul>
          <Li>A project you&apos;ll return to over weeks or months.</Li>
          <Li>At least one multi-feature deliverable (3+ features with deps).</Li>
          <Li>An AI coding agent doing nontrivial work on the codebase.</Li>
          <Li>A history of forgetting decisions across sessions, or shipping stubs that &quot;looked done.&quot;</Li>
        </Ul>

        <H2 id="anti-patterns">Anti-patterns that make it fail</H2>
        <Ol>
          <Li>
            <Strong>Treating the brain as documentation.</Strong> It&apos;s a
            thinking-out-loud log, not docs. Don&apos;t polish entries. Don&apos;t
            prune. Fidelity beats readability.
          </Li>
          <Li>
            <Strong>Hand-editing brain files.</Strong> The agent maintains
            them; you maintain the trigger phrases. If you find yourself
            editing <Code>decisions.md</Code> by hand, something is wrong
            with how you&apos;re talking to pi.
          </Li>
          <Li>
            <Strong>Skipping the design phase on epics.</Strong>{" "}
            <Code>/epic-decompose</Code> on a fuzzy <Code>design.md</Code>{" "}
            produces a fuzzy decomposition. 15 minutes on the design saves
            three halts later.
          </Li>
          <Li>
            <Strong>Forcing every change through an epic.</Strong> Single-file
            features are slower as epics. Use routine sessions for small
            work; reserve epics for multi-feature.
          </Li>
          <Li>
            <Strong>Editing scope mid-epic.</Strong> If F03 needs to grow,
            halt, update <Code>decomposition.yaml</Code>, resume. Don&apos;t
            let the worker quietly expand its scope &mdash; that&apos;s how
            unreviewable PRs come back.
          </Li>
          <Li>
            <Strong>Ignoring halts.</Strong> Halts are the workflow telling
            you the spec needs work. Forcing-through with a retry is the
            single fastest way to make pi-epicflow useless.
          </Li>
          <Li>
            <Strong>Letting the main agent fix issues mid-audit.</Strong>{" "}
            <Code>/project-review</Code> findings should be{" "}
            <Em>logged and triaged</Em>, not fixed reflexively. Delegate to
            steward if you can&apos;t resist the reflex.
          </Li>
        </Ol>

        <H2 id="cheat-sheet">Take-home cheat sheet</H2>
        <P>
          Tape this somewhere &mdash; it&apos;s the entire workflow in
          one card.
        </P>

        <div className="rounded-2xl border border-vibrant-green/30 bg-vibrant-green/5 p-6 my-6">
          <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
            <Map className="w-5 h-5 text-vibrant-green" />
            pi-epicflow in one card
          </h3>
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-vibrant-green font-mono text-xs uppercase tracking-wider mb-1">Setup (once)</div>
              <Pre>{`pi install npm:pi-epicflow@^0.14
/project-init-global       # once per user (optional but recommended)
/project-init              # once per repo`}</Pre>
            </div>
            <div>
              <div className="text-vibrant-green font-mono text-xs uppercase tracking-wider mb-1">Daily use (no commands)</div>
              <P>Just use pi normally. The brain grows via trigger phrases:</P>
              <Ul>
                <Li>&quot;let&apos;s go with X over Y&quot; → <Code>DEC-NNN</Code></Li>
                <Li>&quot;defer X to v2&quot; / &quot;out of scope&quot; → <Code>BL-NNN</Code></Li>
                <Li>&quot;always do X&quot; / &quot;never do Y&quot; → <Code>C-NNN</Code></Li>
                <Li>&quot;watch out for X&quot; / &quot;tripped on Y&quot; → <Code>G-NNN</Code></Li>
                <Li>&quot;open question: X&quot; → <Code>Q-NNN</Code></Li>
                <Li>&quot;globally always X&quot; → <Code>GC-NNN</Code> (overlay)</Li>
              </Ul>
            </div>
            <div>
              <div className="text-vibrant-green font-mono text-xs uppercase tracking-wider mb-1">Multi-feature work</div>
              <Pre>{`pi-epic-init NNNN-name [--from design.md]
/epic-design               # iterate the design
/epic-decompose            # propose + commit decomposition.yaml
/epic-run-auto             # run-to-PR; halts only when blocked`}</Pre>
            </div>
            <div>
              <div className="text-vibrant-green font-mono text-xs uppercase tracking-wider mb-1">Weekly hygiene</div>
              <Pre>{`/project-review            # audit; delegate to steward for unattended sweeps
/project-onboard           # optional warm-up summary when picking up a stale repo`}</Pre>
            </div>
            <div>
              <div className="text-vibrant-green font-mono text-xs uppercase tracking-wider mb-1">When something halts</div>
              <P>Read <Code>.pi/epics/&lt;id&gt;/halt.md</Code>. Fix the underlying issue (clarify design, expand scope, fix test). Re-run <Code>/epic-run-auto</Code> &mdash; resumes from where it halted.</P>
            </div>
          </div>
        </div>

        <H2 id="next">Where to go next</H2>
        <P>
          You now have the complete picture. Three concrete next steps:
        </P>
        <Ol>
          <Li>
            <Strong>Install on your machine</Strong>, run{" "}
            <Code>/project-init-global</Code> with <Em>no</Em> charter file,
            then pick a real (not toy) project you&apos;re working on and run{" "}
            <Code>/project-init</Code>. Talk to pi as you normally would for
            one session. Then open <Code>.pi/project/</Code> and read what
            got written.
          </Li>
          <Li>
            <Strong>Pick one multi-feature change you&apos;ve been
            postponing</Strong>, write a one-page <Code>design.md</Code> for
            it, run <Code>/epic-decompose</Code>, look at the proposed
            decomposition (don&apos;t run it yet). If the decomposition
            looks right, you&apos;re ready. If it doesn&apos;t, the design
            was the problem &mdash; fix the design and try again.
          </Li>
          <Li>
            <Strong>Bookmark this post.</Strong> Re-read the rationale
            recap section every couple of months. It&apos;s the part most
            likely to drift out of working memory when you haven&apos;t
            shipped an epic in a while.
          </Li>
        </Ol>

        <p className="text-white font-semibold text-xl mt-8 leading-relaxed mb-5">
          Two pillars. Four phases. Eight design choices. One workflow that
          ships multi-feature work as one clean PR and keeps the
          decisions that shaped it alive across every future session.
          That&apos;s the whole product.
        </p>

        <div className="mt-16 pt-8 border-t border-slate-border flex flex-wrap gap-3 text-sm text-text-muted">
          <a href="#/blog" className="text-vibrant-green hover:underline inline-flex items-center gap-1">
            <FileCode className="w-4 h-4" />
            All posts
          </a>
          <span className="text-text-muted/50">&middot;</span>
          <a href="#/blog/project-memory" className="text-vibrant-green hover:underline inline-flex items-center gap-1">
            <Brain className="w-4 h-4" />
            Read: project memory (the foundation)
          </a>
          <span className="text-text-muted/50">&middot;</span>
          <a href="#/blog/feature-decomposition" className="text-vibrant-green hover:underline inline-flex items-center gap-1">
            <GitBranch className="w-4 h-4" />
            Read: feature decomposition (epic workflow theory)
          </a>
          <span className="text-text-muted/50">&middot;</span>
          <a href="#/blog/v0-14-end-to-end-guide" className="text-vibrant-green hover:underline inline-flex items-center gap-1">
            <Flag className="w-4 h-4" />
            Read: v0.14 end-to-end (project memory deep-dive)
          </a>
          <span className="text-text-muted/50">&middot;</span>
          <a href={REPO} className="text-vibrant-green hover:underline inline-flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            GitHub
          </a>
          {/* Reserved for future revisions */}
          <span className="sr-only"><AlertTriangle /></span>
        </div>
      </Prose>
    </article>
  );
}
