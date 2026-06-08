/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import {
  Brain,
  FileCode,
  GitBranch,
  Flag,
  ShieldCheck,
  Globe,
  Archive,
  HelpCircle,
  AlertTriangle,
  Boxes,
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

export default function V014EndToEndPost() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <div className="inline-flex items-center gap-2 bg-vibrant-green/10 text-vibrant-green text-xs font-bold font-mono px-3 py-1 rounded-full border border-vibrant-green/20 mb-5 uppercase tracking-widest">
          <Brain className="w-3 h-3" />
          Project memory · v0.14 end-to-end
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
          v0.14, end&#x2011;to&#x2011;end: <span className="text-vibrant-green">how to actually use it</span>
        </h1>
        <p className="text-text-muted text-lg leading-relaxed mb-6">
          A complete walkthrough of pi-epicflow v0.14&apos;s project-memory pillar &mdash; per-repo
          brain, the global cross&#x2011;repo overlay, the new <Code>epicflow-steward</Code> persona,
          Phase 2 artifacts (<Code>gotchas.md</Code>, <Code>questions.md</Code>, module cards),
          and the size+age caps that keep the whole thing from growing into a swamp.
          Read this once and you&apos;ll know what every file is for, when to invoke each
          slash command, and which trigger phrases produce which entries.
        </p>
        <div className="text-sm text-text-muted/70 font-mono">
          2026-05-26 &middot; 18 min read
        </div>
      </motion.header>

      <Prose>
        <P>
          If you read the <a className="text-vibrant-green hover:underline" href="#/blog/project-memory">v0.13 post on project memory</a>,
          you already know the shape: six append-only files in <Code>.pi/project/</Code>,
          trigger-driven writes, stable ids, and five sub-agent personas that prime on
          the brain before they do anything. This post is the <Em>operator&apos;s manual</Em>
          for the v0.14 expansion. By the end you&apos;ll be able to drop into a fresh repo,
          run the right slash command, and have a brain that&apos;s actually used &mdash; not
          one that decays in a folder while you forget it exists.
        </P>

        <Callout kind="info" title="Who this is for">
          You have pi installed (≥0.74) and have shipped at least one feature with an AI
          coding agent. You&apos;re reading this because the agent recently re-asked a
          question you answered last week, or shipped a <Code>TODO</Code> in production, or
          re-decided something you explicitly parked. v0.14 fixes all three. If
          you&apos;ve never used pi or pi-epicflow before, start with the {" "}
          <a className="text-vibrant-green hover:underline" href={REPO}>README quickstart</a>{" "}
          first.
        </Callout>

        <H2 id="mental-model">The mental model in 90 seconds</H2>
        <P>
          v0.14 is three things stacked on top of v0.13:
        </P>
        <Ol>
          <Li>
            <Strong>Phase 2 brain artifacts.</Strong> Three new files in
            <Code>.pi/project/</Code>: <Code>gotchas.md</Code>,{" "}
            <Code>questions.md</Code>, and a <Code>modules/</Code> directory for
            per-module cards. They graduate concerns that didn&apos;t fit cleanly
            into v0.13&apos;s six core files.
          </Li>
          <Li>
            <Strong>A global cross-repo overlay</Strong> at{" "}
            <Code>~/.pi/global-memory/</Code>. Your personal/team conventions and
            cross-project defaults live here instead of being re-stated in every
            repo. Per-repo always wins on conflict &mdash; the overlay is strictly
            additive.
          </Li>
          <Li>
            <Strong>A new <Code>epicflow-steward</Code> persona</Strong> with a
            strict write-allowlist. The steward can only touch brain files &mdash;
            never source, tests, git, or config. Use it when you want to run
            <Code>/project-review</Code> across three repos without risking the
            agent helpfully fixing the issues it flagged.
          </Li>
        </Ol>
        <P>
          Plus two foundational improvements that touch every artifact:
        </P>
        <Ul>
          <Li>
            <Strong>Progressive-disclosure <Code>index.md</Code>.</Strong> A
            top-of-file &quot;Read for X&quot; routing table so the agent loads
            only the artifacts a turn actually needs. The brain can grow without
            making every session more expensive.
          </Li>
          <Li>
            <Strong>Size + age caps with manual rollover.</Strong> Each artifact
            has a soft cap (e.g. <Code>decisions.md</Code> at 500 entries / 2
            years). <Code>/project-review</Code> flags exceedances and prints a
            rollover recipe. Nothing is ever deleted automatically.
          </Li>
        </Ul>

        <H2 id="day-zero">Day zero &mdash; the two one-time installs</H2>
        <P>
          You do these once per machine. Skip ahead if v0.14 is already installed
          and the global overlay already exists.
        </P>

        <H3 id="install-pi-epicflow">Install pi-epicflow v0.14</H3>
        <Pre>{`# Recommended (from npm):
pi install npm:pi-epicflow@^0.14

# Or pin to a specific tag:
pi install npm:pi-epicflow@0.14.1

# Or from git (only if you need unreleased commits):
pi install git:github.com/shankar029/pi-epicflow`}</Pre>
        <P>
          Postinstall registers the skill, the slash commands, and all six
          <Code>epicflow-*</Code> personas (including the new
          <Code>epicflow-steward</Code>). The script is idempotent &mdash; safe to
          re-run on an upgrade. If you previously installed v0.13.x, your
          existing <Code>.pi/project/</Code> directories will keep working
          unchanged; v0.14 features are opt-in.
        </P>

        <H3 id="init-global">Scaffold the global overlay (optional but recommended)</H3>
        <P>
          Run this <Em>once</Em> per user account, not per repo:
        </P>
        <Pre>{`you ▸ /project-init-global
pi  ▸ I'll create ~/.pi/global-memory/ with 4 files:
        - index.md       (routing)
        - charter.md     (personal/team identity — optional)
        - conventions.md (cross-repo always/never rules)
        - decisions.md   (cross-repo decisions like "ruff+uv for Python")
      This affects pi sessions in EVERY repo (loaded after per-repo brain,
      per-repo always wins on conflict). Per DEC-006 in pi-epicflow.
      Proceed? (y/N)
you ▸ y
pi  ▸ Owner name (for the charter header)? (defaults to $USER)
you ▸ Shankar B.
pi  ▸ Do you want a charter file? Recommended "no" for first-time setup —
      personal charters tend to fill with platitudes on day 1. You can
      always cp the template later.
you ▸ no
pi  ▸ ✅ ~/.pi/global-memory/ initialized.
      Files created:
        ~/.pi/global-memory/index.md
        ~/.pi/global-memory/conventions.md
        ~/.pi/global-memory/decisions.md
      What happens next:
        - Future pi sessions in every repo will load this overlay AFTER
          the per-repo .pi/project/ brain.
        - Per-repo rules always win on conflict; pi will surface a one-
          line note when an override happens.
        - Say "globally always X" or "across all my repos" in any
          session to append a GC-NNN or GD-NNN entry.`}</Pre>
        <P>
          The prompt is <Em>idempotent</Em>: if{" "}
          <Code>~/.pi/global-memory/index.md</Code> already exists, it stops
          and tells you so. It won&apos;t overwrite. (Same hardening as v0.13.1&apos;s
          <Code>/project-init</Code>, per the BL-005 lesson.)
        </P>

        <Callout kind="info" title="Why no global sessions.md or backlog.md?">
          Sessions happen <Em>in</Em> a repo. Backlog items belong to the repo
          that produced them. Cross-repo patterns surface as conventions
          (<Code>GC-NNN</Code>) or decisions (<Code>GD-NNN</Code>), not as work
          items. If you have cross-repo work to track, open per-repo backlog
          entries in each affected repo and tag them <Code>cross-repo: yes</Code>.
          Decision recorded as <a className="text-vibrant-green hover:underline" href={`${REPO}/blob/main/.pi/project/decisions.md`}>DEC-006</a>.
        </Callout>

        <H3 id="init-per-repo">Scaffold a per-repo brain</H3>
        <P>
          Do this <Em>once per repo</Em>, the first time you open pi in it:
        </P>
        <Pre>{`cd ~/code/my-project
pi
you ▸ /project-init
pi  ▸ [reads README, CHANGELOG, package.json / pyproject.toml]
      I'll create .pi/project/ with 9 files inferred from the repo:
        - index.md         (router; "Read for X" table)
        - charter.md       (goal, non-goals, quality bar)
        - conventions.md   (always/never rules; pre-seeded with anti-stub C-001)
        - decisions.md     (empty; first entry will be the first /epic-decompose call)
        - backlog.md       (empty; will fill as you defer items)
        - sessions.md      (S-001 opened for this session)
        - gotchas.md       (empty; v0.14 Phase 2)
        - questions.md     (empty; v0.14 Phase 2)
        - modules/         (README + _template.md; cards are user-authored)
      Inferred from the repo:
        - quality bar: "passes pytest -q and ruff check ."
        - primary user: "ops engineer who runs the CLI locally"
        - test policy: "every public function has at least one test"
      Proceed? (y/N)
you ▸ y, but quality bar should also include "mypy --strict on src/"
pi  ▸ [edits the inferred charter draft to include mypy]
      ✅ .pi/project/ initialized. 9 files committed in 1 commit.`}</Pre>

        <P>
          From this point on, you don&apos;t need to invoke{" "}
          <Code>/project-init</Code> again in this repo. The brain grows
          autonomously from trigger phrases in your sessions.
        </P>

        <H2 id="nine-files">The nine files (and what fires writes to each)</H2>
        <P>
          Here&apos;s the full v0.14 layout, with the trigger phrase that produces
          each entry type. Read this once; you won&apos;t need to memorize it
          &mdash; the agent watches for these for you.
        </P>

        <div className="overflow-x-auto mb-6 rounded-2xl border border-slate-border">
          <table className="w-full text-sm">
            <thead className="bg-slate-surface/60">
              <tr className="text-left">
                <th className="p-3 font-semibold text-white">File</th>
                <th className="p-3 font-semibold text-white">ID prefix</th>
                <th className="p-3 font-semibold text-white">Trigger phrase pattern</th>
              </tr>
            </thead>
            <tbody className="text-text-muted">
              <tr className="border-t border-slate-border">
                <td className="p-3"><Code>index.md</Code></td>
                <td className="p-3">&mdash;</td>
                <td className="p-3">Only edited by <Code>/project-review</Code> recommendations or archive rollovers. Never trigger-written.</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3"><Code>charter.md</Code></td>
                <td className="p-3">&mdash;</td>
                <td className="p-3">User-driven edits. Goal / non-goal / owner changes flow via <Code>/project-review</Code> or explicit asks.</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3"><Code>conventions.md</Code></td>
                <td className="p-3"><Code>C-NNN</Code></td>
                <td className="p-3">&quot;always do X&quot;, &quot;never do Y&quot;, &quot;from now on&quot;</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3"><Code>decisions.md</Code></td>
                <td className="p-3"><Code>DEC-NNN</Code></td>
                <td className="p-3">&quot;let&apos;s go with X over Y&quot; (with technical noun)</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3"><Code>backlog.md</Code></td>
                <td className="p-3"><Code>BL-NNN</Code></td>
                <td className="p-3">&quot;defer X to v2&quot;, &quot;out of scope&quot;, &quot;park this&quot; (with work-noun)</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3"><Code>sessions.md</Code></td>
                <td className="p-3"><Code>S-NNN</Code></td>
                <td className="p-3">Auto-opened at session start; closed by <Code>/session-end</Code> or pi-proposed close.</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3"><Code>gotchas.md</Code> <Em>(v0.14)</Em></td>
                <td className="p-3"><Code>G-NNN</Code></td>
                <td className="p-3">&quot;watch out for X&quot;, &quot;tripped on Y&quot;, &quot;footgun: Z&quot;</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3"><Code>questions.md</Code> <Em>(v0.14)</Em></td>
                <td className="p-3"><Code>Q-NNN</Code></td>
                <td className="p-3">&quot;open question: X&quot;, &quot;we&apos;re still deciding Y&quot;, &quot;unclear whether Z&quot;</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3"><Code>modules/&lt;name&gt;.md</Code> <Em>(v0.14)</Em></td>
                <td className="p-3">&mdash;</td>
                <td className="p-3">User-authored. Copy <Code>modules/_template.md</Code> and fill in.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Callout kind="warn" title="False positives matter more than recall">
          The trigger rules are intentionally tight. &quot;I&apos;ll always remember
          that&quot; is <Em>not</Em> a convention trigger &mdash; it&apos;s conversational.
          &quot;Later&quot; without a work-noun is <Em>not</Em> a backlog trigger.
          A brain that writes spurious entries gets ignored within a week.
          When in doubt, the agent will <Em>ask</Em> before writing
          (&quot;sounds like a convention &mdash; want me to record it as C-NNN?&quot;).
        </Callout>

        <H2 id="walkthrough">A complete session walkthrough</H2>
        <P>
          Here&apos;s a single 25-minute session in a fictional Python CLI repo,
          showing every trigger type firing in one flow. Watch what pi writes
          and when.
        </P>

        <Pre>{`you ▸ pi
pi  ▸ [autoloads project-memory skill]
      [reads .pi/project/index.md — sees "Read for X" table]
      [routing table says: charter + conventions are always-load; rest on demand]
      [reads charter.md, conventions.md]
      [also loads ~/.pi/global-memory/index.md → loads conventions + decisions]
      [opens S-014 with **Status:** in-progress]

      Loaded:
        - .pi/project/index.md, charter.md (3 sections), conventions.md (8 rules)
        - ~/.pi/global-memory/conventions.md (5 GC rules)
        - 2 open backlog items (BL-007, BL-011) flagged by routing table

      What's the goal for this session?

you ▸ make the --since flag accept "yesterday", "today", and ISO dates

pi  ▸ Goal recorded as S-014. I'll halt before unrelated work and ask
      "park or pivot?".

      [reads src/cli.py, src/dates.py — relevant per the goal]
      [runs grep for --since usages → 3 callsites]

      I see three approaches. Let's go with dateparser over manual parsing —
      it handles "yesterday/today" out of the box and is a transitive dep
      already (pulled in by pendulum).

you ▸ agreed
pi  ▸ [writes DEC-021 to .pi/project/decisions.md]
        ## DEC-021 — Use dateparser for --since natural language
        **Date:** 2026-05-26
        **Status:** active
        **Decision:** dateparser.parse over manual mapping.
        **Alternatives:** manual mapping (rejected: fragile), pendulum's
          relative-time API (rejected: only handles "now+/-N units").
        **Consequences:** Already a transitive dep; no new install. Locale
          defaults to en_US — explicit setting required for non-English users.

      [implements src/dates.py, updates src/cli.py, runs pytest -q]
      [tests pass; 4 new tests written for natural-language + ISO inputs]

      Note: while testing I noticed dateparser silently accepts "tomorrow"
      and other forward-looking inputs. That's an open question — do we
      want to allow forward dates or reject them as user error?

you ▸ good catch, open question for now, I'm not sure yet

pi  ▸ [writes Q-003 to .pi/project/questions.md]
        ## Q-003 — Allow forward-looking dates in --since?
        **Status:** open
        **Asked:** 2026-05-26 (S-014)
        **Context:** dateparser accepts "tomorrow", "next week" etc. without
          warning. Current behavior: --since 'tomorrow' returns no rows
          (correct), but silently — no UX signal.
        **Options:**
          (a) reject forward dates with clear error
          (b) allow but warn on stderr
          (c) allow silently (current behavior)
        **Revisit when:** a real user reports confusion, or we add --until
          which has the symmetric question

      Continuing with the --since work.

      [...]

      One more thing — I tripped on dateparser's locale heuristic during
      testing. Without an explicit settings dict, it interprets "01/02/2026"
      as Jan 2 in en_US but Feb 1 in en_GB. Worth recording.

you ▸ yes, that's a footgun

pi  ▸ [writes G-007 to .pi/project/gotchas.md]
        ## G-007 — dateparser locale ambiguity on numeric DMY/MDY
        **Status:** active
        **Symptom:** "01/02/2026" parses differently across machines.
        **Root cause:** dateparser falls back to locale heuristic.
        **Fix:** Always pass settings={'DATE_ORDER':'YMD'} unless we
          surface a --date-order flag. See src/dates.py:parse_since.
        **Still applies if:** we keep dateparser as the engine (DEC-021).

      Tests still green. CLI works. Anything else for S-014?

you ▸ let's defer the --until flag to v0.5 — out of scope here

pi  ▸ [writes BL-019 to .pi/project/backlog.md]
        ## BL-019 — Symmetric --until flag
        **Status:** open
        **Source session:** S-014
        **Summary:** parallel to --since, accepting same date forms.
        **Deferred because:** out of scope for current session goal.
        **Revisit when:** v0.5 milestone planning, OR a user files
          a feature request, OR Q-003 (forward-dates) gets resolved
          (since --until forces the same call).

      Anything else, or close S-014?

you ▸ from now on, every CLI date input goes through dates.parse_since,
      never raw dateparser

pi  ▸ [writes C-009 to .pi/project/conventions.md]
        ## C-009 — All CLI date inputs go through dates.parse_since
        **Date:** 2026-05-26
        **Status:** active
        **Rule:** No direct dateparser.parse() calls in CLI command modules.
          Route through src/dates.py:parse_since which applies our settings
          dict (G-007) and our forward-date policy (pending Q-003).
        **Enforcement:** reviewer grep gate. Worker self-check.

      Close S-014?

you ▸ yes
pi  ▸ [closes S-014 in sessions.md: **Status:** achieved, summary, files
        touched, decisions promoted: DEC-021, conventions: C-009, gotchas:
        G-007, questions: Q-003, backlog: BL-019]
      Done. 1 DEC, 1 C, 1 G, 1 Q, 1 BL written. Goal achieved.`}</Pre>

        <P>
          Notice three things about that flow:
        </P>
        <Ul>
          <Li>
            <Strong>Writes happen at the trigger moment</Strong>, not at the end.
            If pi crashed after the <Code>DEC-021</Code> write but before
            <Code>C-009</Code>, the decision survives and the convention can be
            added in the next session.
          </Li>
          <Li>
            <Strong>Every entry has a back-reference</Strong>. <Code>BL-019</Code>{" "}
            references <Code>Q-003</Code> because resolving the forward-date
            question forces the symmetric question on <Code>--until</Code>.
            Future you (or a future session) can trace why decisions were made.
          </Li>
          <Li>
            <Strong>The session log is the audit trail.</Strong>{" "}
            <Code>S-014</Code> in <Code>sessions.md</Code> lists everything
            promoted to longer-lived files. You can <Code>grep</Code> for{" "}
            <Code>S-014</Code> across the whole brain to see what that session
            produced.
          </Li>
        </Ul>

        <H2 id="resolution">Resolving a question (the double-write)</H2>
        <P>
          Questions in <Code>questions.md</Code> stay <Code>open</Code> until a
          decision resolves them. When that happens, pi performs the only
          non-append edit allowed in the brain &mdash; flipping{" "}
          <Code>**Status:** open</Code> to{" "}
          <Code>**Status:** resolved (see DEC-NNN)</Code> on the question entry,
          while simultaneously appending a new <Code>DEC-NNN</Code> in
          <Code>decisions.md</Code> with <Code>resolves: Q-NNN</Code>:
        </P>

        <Pre>{`you ▸ on Q-003, let's reject forward dates with a clear error message —
      symmetry breaks for --until anyway and silent failure is the worst UX

pi  ▸ [appends DEC-027 to decisions.md]
        ## DEC-027 — Reject forward dates in --since
        **Date:** 2026-06-10
        **Resolves:** Q-003
        **Status:** active
        **Decision:** parse_since() raises ValueError("--since cannot be in
          the future") for any parsed date > now. CLI catches and exits 2.
        **Alternatives:** allow-and-warn (rejected: warnings get piped to /dev/null
          in CI), allow-silent (current; rejected: surprising in --until context).
        **Consequences:** breaking change for users relying on the no-rows
          behavior. Surface in CHANGELOG.

      [flips Q-003 status in questions.md]
        ## Q-003 — Allow forward-looking dates in --since?
        **Status:** resolved (see DEC-027) on 2026-06-10
        [...rest of entry unchanged...]

      DEC-027 / Q-003 resolution recorded.`}</Pre>

        <P>
          This is the <Strong>only</Strong> place in the brain where pi edits an
          existing entry in place. Every other update is append-with-supersede.
          The exception exists because an unresolved question that&apos;s been
          resolved should stop showing up in routine grep results &mdash;
          otherwise <Code>open question</Code> grep lists drift toward useless.
        </P>

        <H2 id="modules">Module cards: when and how</H2>
        <P>
          Module cards are the only Phase 2 artifact that&apos;s{" "}
          <Em>not</Em> trigger-written. v0.14 ships a{" "}
          <Code>modules/_template.md</Code> you copy by hand. There&apos;s no{" "}
          <Code>/project-module-card</Code> command yet &mdash; deliberately
          deferred until usage signal justifies one.
        </P>

        <P>
          Author a card when one of these triggers from outside the brain fires:
        </P>
        <Ul>
          <Li>
            A new contributor (human or AI) asked &quot;what does <Code>auth/</Code> do?&quot;
            and you wrote a 10-line answer. Capture that answer.
          </Li>
          <Li>
            You refactored a module and the entry on its public surface in
            <Code>charter.md</Code> is now wrong but the module is too detailed
            for the charter.
          </Li>
          <Li>
            <Code>/project-review</Code>&apos;s <Strong>A-6 module coverage
            audit</Strong> flagged a module with no card. (It only flags
            modules that appear in <Code>decisions.md</Code> back-references or
            that the agent has touched in three or more sessions.)
          </Li>
        </Ul>

        <P>The template:</P>
        <Pre>{`# Module: auth/

**Public surface:**
- \`authenticate(token: str) -> User\`
- \`Session.create(user: User) -> Session\`
- env vars: \`AUTH_SECRET\`, \`AUTH_TTL_SECONDS\`

**Depends on:**
- \`db/\` (Session is persisted)
- \`crypto/\` (token signing)

**Owns:**
- \`src/auth/*.py\`, \`tests/auth/*.py\`

**Gotchas / decisions:**
- G-004 (timing-attack-safe comparison)
- DEC-012 (refresh tokens deferred to v2)

**Last verified:** 2026-05-26 (S-014)`}</Pre>

        <P>
          Two rules for module cards:
        </P>
        <Ol>
          <Li>
            <Strong>One folder = one card.</Strong> Don&apos;t split{" "}
            <Code>auth/</Code> into <Code>auth-token.md</Code> +{" "}
            <Code>auth-session.md</Code>. If the module is too big for one card,
            it&apos;s too big for one module &mdash; refactor first.
          </Li>
          <Li>
            <Strong>Cards live under <Code>.pi/project/modules/</Code>, not
            <Code>.pi/modules/</Code>.</Strong> This preserves the &quot;one
            folder = one brain&quot; invariant from <a className="text-vibrant-green hover:underline" href={`${REPO}/blob/main/.pi/project/decisions.md`}>DEC-004</a>{" "}
            &mdash; everything brain-related lives under <Code>.pi/project/</Code>.
          </Li>
        </Ol>

        <H2 id="global-overlay">The global overlay in practice</H2>
        <P>
          The overlay solves one specific problem: re-stating the same rule in
          every repo&apos;s <Code>conventions.md</Code>. Anything else (decisions,
          gotchas, sessions, backlog) belongs in per-repo. The trigger
          vocabulary is intentionally narrow:
        </P>

        <div className="overflow-x-auto mb-6 rounded-2xl border border-slate-border">
          <table className="w-full text-sm">
            <thead className="bg-slate-surface/60">
              <tr className="text-left">
                <th className="p-3 font-semibold text-white">You say&hellip;</th>
                <th className="p-3 font-semibold text-white">Lands in</th>
                <th className="p-3 font-semibold text-white">ID</th>
              </tr>
            </thead>
            <tbody className="text-text-muted">
              <tr className="border-t border-slate-border">
                <td className="p-3">&quot;globally always X&quot;</td>
                <td className="p-3">global <Code>conventions.md</Code></td>
                <td className="p-3"><Code>GC-NNN</Code></td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3">&quot;across all my repos, X&quot;</td>
                <td className="p-3">global <Code>conventions.md</Code></td>
                <td className="p-3"><Code>GC-NNN</Code></td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3">&quot;in every Python project of mine, X&quot;</td>
                <td className="p-3">global <Code>conventions.md</Code> (scope: <Code>language:python</Code>)</td>
                <td className="p-3"><Code>GC-NNN</Code></td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3">&quot;I always go with X for new projects&quot;</td>
                <td className="p-3">global <Code>decisions.md</Code></td>
                <td className="p-3"><Code>GD-NNN</Code></td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3">&quot;my default is X&quot;</td>
                <td className="p-3">global <Code>decisions.md</Code></td>
                <td className="p-3"><Code>GD-NNN</Code></td>
              </tr>
            </tbody>
          </table>
        </div>

        <P>
          Bare &quot;always do X&quot; without cross-repo framing still fires the
          per-repo trigger. The overlay is for explicitly-personal rules.
        </P>

        <H3 id="conflict-resolution">When per-repo and global disagree</H3>
        <P>
          The agent applies the per-repo rule and surfaces a one-line note:
        </P>
        <Pre>{`Note: per-repo C-007 (formatter: black) overrides global GC-003
(formatter: ruff format) for this repo.`}</Pre>
        <P>
          You can either:
        </P>
        <Ul>
          <Li>
            Leave it as-is &mdash; this repo&apos;s convention is intentional.
          </Li>
          <Li>
            Promote the global rule by saying &quot;actually let&apos;s drop C-007
            and follow global&quot;. The agent supersedes <Code>C-007</Code> with
            a new entry pointing to <Code>GC-003</Code>.
          </Li>
        </Ul>

        <Callout kind="info" title="The overlay is opt-in">
          If <Code>~/.pi/global-memory/</Code> doesn&apos;t exist, every repo
          works exactly as it did in v0.13. The overlay is for the
          &quot;juggling 3-4 parallel projects&quot; case &mdash; if you
          don&apos;t have that problem, don&apos;t run{" "}
          <Code>/project-init-global</Code>.
        </Callout>

        <H2 id="steward">The <Code>epicflow-steward</Code> persona</H2>
        <P>
          v0.14&apos;s new sub-agent persona is a <Strong>brain-only</Strong>
          delegation target. Its write-allowlist is hard-coded into the persona
          prompt:
        </P>
        <Ul>
          <Li><Code>.pi/project/*.md</Code></Li>
          <Li><Code>.pi/project/modules/*.md</Code></Li>
          <Li><Code>.pi/project/*-archive-*.md</Code></Li>
          <Li><Code>~/.pi/global-memory/*.md</Code></Li>
        </Ul>
        <P>
          That&apos;s it. Source code, tests, <Code>package.json</Code>, git
          state, <Code>.git/</Code>, install scripts, the website &mdash; all
          off-limits. If you ask the steward to fix an issue it flagged, it
          returns a <Em>Refused &mdash; not-brain-work</Em> template and tells you
          which persona should do the fix instead.
        </P>

        <H3 id="when-steward">When to use it</H3>
        <P>You have three good reasons to invoke the steward:</P>
        <Ol>
          <Li>
            <Strong>Multi-repo sweeps.</Strong> You want to run{" "}
            <Code>/project-review</Code> across three repos in one sitting
            without risking the main agent helpfully editing code in repo
            number two.
          </Li>
          <Li>
            <Strong>Background hygiene.</Strong> You want to fire-and-forget
            an audit while you work on something else, knowing the diff will
            only ever touch <Code>.pi/project/</Code>.
          </Li>
          <Li>
            <Strong>Untrusted brain work.</Strong> You&apos;ve given another agent
            (or a less-trusted collaborator&apos;s pi session) permission to
            propose brain edits, but you want a strict write-allowlist
            backstop.
          </Li>
        </Ol>

        <H3 id="how-steward">How to invoke it</H3>
        <P>From inside a pi session:</P>
        <Pre>{`you ▸ /project-review
pi  ▸ Run the audit interactively, or delegate to epicflow-steward for an
      unattended sweep? Delegation is recommended if you'll be running
      /project-review across multiple repos in sequence.

you ▸ delegate

pi  ▸ [subagent { agent: "epicflow-steward", task: "sweep" }]
      [steward primes on .pi/project/index.md + global overlay]
      [steward runs A-0 through A-8 audits]
      [steward returns Steward Report template]

      Steward report — my-project @ main
      Mode: sweep
      Brain primed: yes
      Global overlay loaded: yes

      Findings:
        A-1 Staleness: 1 stale (charter.md last_verified=2026-03-01)
        A-2 Backlog ripeness: 2 ripe (BL-007 — auth lands in v0.4, now active;
          BL-011 — referenced 3× in S-022..S-024)
        A-8 Capacity caps: backlog.md at 187/200 — approaching cap

      Recommendations (no edits made):
        1. Approve BL-007 → epic promotion; suggested epic name "0007-mfa-refresh"
        2. Refresh charter.md last_verified; nothing else stale changed
        3. Plan a backlog rollover before hitting 200; recommended cutoff
           BL-100 (the last v0.3 entry)

      Edits made: None — read-only sweep.

      Recommended next step:
        - Approve recommendation 1; I (the main agent) can then run
          /epic-design 0007-mfa-refresh.`}</Pre>

        <P>
          The steward never auto-promotes or auto-rolls-over. It surfaces
          recommendations; you decide.
        </P>

        <Callout kind="warn" title="The steward is not the main agent">
          <Code>epicflow-steward</Code> is a <Em>delegation target</Em>, not a
          replacement. The main pi session can do everything the steward can
          do, plus actual code work. Use the steward when you want a strict
          write-scope guarantee &mdash; not because it&apos;s &quot;better at
          brain work&quot;. It isn&apos;t.
        </Callout>

        <H2 id="capacity">Capacity, age caps, and rollover</H2>
        <P>
          The brain is append-only, so it grows monotonically. Without bounds,
          a long-lived repo eventually has a <Code>decisions.md</Code> with
          1,400 entries and every session pays the read cost. v0.14 adds soft
          caps per artifact:
        </P>

        <div className="overflow-x-auto mb-6 rounded-2xl border border-slate-border">
          <table className="w-full text-sm">
            <thead className="bg-slate-surface/60">
              <tr className="text-left">
                <th className="p-3 font-semibold text-white">Artifact</th>
                <th className="p-3 font-semibold text-white">Entry cap</th>
                <th className="p-3 font-semibold text-white">Age cap</th>
              </tr>
            </thead>
            <tbody className="text-text-muted">
              <tr className="border-t border-slate-border">
                <td className="p-3"><Code>decisions.md</Code></td>
                <td className="p-3">500</td>
                <td className="p-3">any entry &gt; 2 years</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3"><Code>backlog.md</Code></td>
                <td className="p-3">200</td>
                <td className="p-3">any open entry &gt; 180 days</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3"><Code>sessions.md</Code></td>
                <td className="p-3">150</td>
                <td className="p-3">any closed entry &gt; 1 year</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3"><Code>gotchas.md</Code></td>
                <td className="p-3">200</td>
                <td className="p-3">any entry &gt; 2 years</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3"><Code>questions.md</Code></td>
                <td className="p-3">50 open + 200 resolved</td>
                <td className="p-3">any open &gt; 1 year</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3"><Code>conventions.md</Code></td>
                <td className="p-3">uncapped</td>
                <td className="p-3">superseded rules pruned at rollover</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3"><Code>charter.md</Code></td>
                <td className="p-3">uncapped</td>
                <td className="p-3">&mdash; (rarely changes)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <P>
          When a cap is exceeded, <Code>/project-review</Code>&apos;s <Strong>A-8
          audit</Strong> recommends a manual rollover. <Em>Manual</Em> is
          deliberate &mdash; the agent never silently archives. You confirm the
          cutoff; the agent executes:
        </P>

        <Pre>{`# Recommended by /project-review when decisions.md hits 500 entries:
git mv decisions.md decisions-archive-2026.md

# Then create a fresh decisions.md with header + entries after cutoff.
# Add an "Archives" row to .pi/project/index.md pointing at the new file.
# Commit with a clear message.`}</Pre>

        <P>
          <Strong>Stable ids never recycle.</Strong> If{" "}
          <Code>decisions-archive-2026.md</Code> ends at <Code>DEC-487</Code>,
          the live file starts at <Code>DEC-488</Code>. Cross-references in
          older sessions stay valid forever. A future grep for{" "}
          <Code>DEC-042</Code> hits the archive; the routing table in{" "}
          <Code>index.md</Code> lists archive locations so pi knows where to
          look.
        </P>

        <Callout kind="info" title="When to actually roll over">
          The caps are <Em>soft</Em>. Hitting 510 entries doesn&apos;t break
          anything. Roll over when:
          <Ul>
            <Li><Code>/project-review</Code> A-8 flags the cap exceeded for the second consecutive sweep, AND</Li>
            <Li>The cap-exceeding artifact is one you re-read frequently (sessions, decisions), not a write-and-forget archive (charter), AND</Li>
            <Li>You can identify a clean cutoff entry (e.g. the last entry from a shipped major version).</Li>
          </Ul>
          If those don&apos;t hold, push the cap up. The exact number was a
          guess &mdash; your repo&apos;s right number may be different.
        </Callout>

        <H2 id="weekly">A weekly rhythm</H2>
        <P>
          Here&apos;s the cadence that works in practice:
        </P>
        <Ul>
          <Li>
            <Strong>Every session start</Strong> &mdash; the skill autoloads;
            <Code>S-NNN</Code> opens. You don&apos;t do anything.
          </Li>
          <Li>
            <Strong>Every session end</Strong> &mdash; the agent proposes{" "}
            <Code>/session-end</Code>. Accept it. Closing the session forces
            the end-of-task sweep and writes the <Code>S-NNN</Code> summary.
          </Li>
          <Li>
            <Strong>Once a week or before planning</Strong> &mdash; run{" "}
            <Code>/project-review</Code>. Delegate to{" "}
            <Code>epicflow-steward</Code> if you have multiple repos to sweep.
            Review the recommendations; promote ripe backlog items into
            epics; refresh stale <Code>last_verified</Code> dates.
          </Li>
          <Li>
            <Strong>When picking up an unfamiliar repo</Strong> &mdash; run{" "}
            <Code>/project-onboard</Code> for a 5-line orientation summary.
            Optional; the skill autoloads anyway.
          </Li>
          <Li>
            <Strong>When the brain has clearly drifted</Strong> &mdash; e.g.
            you superseded a decision verbally but the old DEC entry still
            says <Code>active</Code>. Tell pi explicitly:{" "}
            <Em>&quot;DEC-021 is superseded by today&apos;s choice; update the
            brain.&quot;</Em> Pi appends the new entry with{" "}
            <Code>supersedes: DEC-021</Code> and flips the old entry&apos;s
            status to <Code>superseded</Code>.
          </Li>
        </Ul>

        <H2 id="pitfalls">Common pitfalls</H2>
        <Ol>
          <Li>
            <Strong>Treating the brain as documentation.</Strong> It&apos;s a
            <Em>thinking-out-loud log</Em>, not docs. Don&apos;t polish entries.
            Don&apos;t prune. The point is fidelity, not readability.
          </Li>
          <Li>
            <Strong>Forgetting that per-repo wins on conflict.</Strong> When
            you set a global rule, check whether per-repo files contradict it.
            They&apos;ll silently win and you&apos;ll wonder why the global rule
            isn&apos;t being applied. Look for the <Em>&quot;Note: per-repo X
            overrides global Y&quot;</Em> banner on session start.
          </Li>
          <Li>
            <Strong>Authoring module cards prematurely.</Strong> Don&apos;t card
            every directory on day one. Wait for the third time someone
            (human or AI) asks &quot;what does this do?&quot;.
          </Li>
          <Li>
            <Strong>Ignoring the routing table.</Strong> The progressive-
            disclosure <Code>index.md</Code> is the agent&apos;s discovery layer.
            When you add an artifact (e.g. a new archive), add the row to
            <Code>index.md</Code> too &mdash; otherwise the agent won&apos;t know
            it exists when grepping for an id.
          </Li>
          <Li>
            <Strong>Letting the agent fix issues mid-audit.</Strong> If
            you&apos;re running <Code>/project-review</Code> in the main session
            and pi offers to fix a code-level issue it flagged, say{" "}
            <Em>&quot;not yet, finish the audit first&quot;</Em>. This is
            exactly the failure mode <Code>epicflow-steward</Code> exists to
            prevent.
          </Li>
        </Ol>

        <H2 id="install-now">Install and run it</H2>
        <Pre>{`# Install v0.14.1:
pi install npm:pi-epicflow@^0.14

# Per-user, once:
pi
you ▸ /project-init-global

# Per-repo, once each:
cd ~/code/my-project && pi
you ▸ /project-init

# Then just use pi as you normally would. The brain grows on its own.`}</Pre>

        <p className="text-white font-semibold text-xl mt-8 leading-relaxed mb-5">
          You can&apos;t skim a project brain into existence. You can ship a
          starter today and watch it accumulate, one trigger phrase at a
          time, into the artifact that makes every future session 5 minutes
          shorter and one decision better.
        </p>

        <div className="mt-16 pt-8 border-t border-slate-border flex flex-wrap gap-3 text-sm text-text-muted">
          <a href="#/blog" className="text-vibrant-green hover:underline inline-flex items-center gap-1">
            <FileCode className="w-4 h-4" />
            All posts
          </a>
          <span className="text-text-muted/50">&middot;</span>
          <a href="#/blog/project-memory" className="text-vibrant-green hover:underline inline-flex items-center gap-1">
            <Brain className="w-4 h-4" />
            Read: v0.13 project memory (the foundation)
          </a>
          <span className="text-text-muted/50">&middot;</span>
          <a href="#/blog/feature-decomposition" className="text-vibrant-green hover:underline inline-flex items-center gap-1">
            <GitBranch className="w-4 h-4" />
            Read: Feature decomposition
          </a>
          <span className="text-text-muted/50">&middot;</span>
          <a href={`${REPO}/blob/main/skills/project-memory/SKILL.md`} className="text-vibrant-green hover:underline inline-flex items-center gap-1">
            <Globe className="w-4 h-4" />
            project-memory SKILL.md
          </a>
          <span className="text-text-muted/50">&middot;</span>
          <a href={`${REPO}/blob/main/CHANGELOG.md`} className="text-vibrant-green hover:underline inline-flex items-center gap-1">
            <Archive className="w-4 h-4" />
            CHANGELOG
          </a>
          <span className="text-text-muted/50">&middot;</span>
          <a href={`${REPO}/issues`} className="text-vibrant-green hover:underline inline-flex items-center gap-1">
            <HelpCircle className="w-4 h-4" />
            Report an issue
          </a>
          <span className="text-text-muted/50">&middot;</span>
          <a href={`${REPO}`} className="text-vibrant-green hover:underline inline-flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            GitHub
          </a>
          {/* Suppress unused-import warnings — these symbols are reserved for
              follow-up sections (module cards alerts, etc.) that may be
              added in v0.14.x revisions of this post. */}
          <span className="sr-only"><AlertTriangle /><Boxes /><Flag /></span>
        </div>
      </Prose>
    </article>
  );
}
