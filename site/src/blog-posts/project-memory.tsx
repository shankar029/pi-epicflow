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

export default function ProjectMemoryPost() {
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
          Project memory
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
          Project memory: pi sessions that <span className="text-vibrant-green">stop forgetting</span>
        </h1>
        <p className="text-text-muted text-lg leading-relaxed mb-6">
          Your coding agent has amnesia. Every new session starts at zero and re-asks
          questions you answered yesterday. v0.13 fixes it with a six-file project brain at{" "}
          <Code>.pi/project/</Code> — append-only, trigger-driven, no vector store required.
        </p>
        <div className="text-sm text-text-muted/70 font-mono">
          2026-05-26 · 9 min read
        </div>
      </motion.header>

      <Prose>
        <P>
          You ship a feature with an AI coding agent on Tuesday afternoon. You make three
          architectural decisions along the way: <Em>we're caching in Redis, not Postgres</Em>;{" "}
          <Em>client-side timezone is the source of truth</Em>; <Em>defer the multi-tenant
          story to v2</Em>. The feature lands. You close the laptop.
        </P>
        <P>
          Wednesday morning you open a fresh agent session in the same repo. The agent has
          no idea those three decisions exist. It asks whether to cache in Postgres or Redis.
          It assumes server-side timezones. It helpfully starts laying foundations for the
          multi-tenant story you explicitly parked.
        </P>
        <P>
          This isn't a memory bug. The agent is working as designed — every session is a
          fresh context. The real bug is that <Strong>the project itself has no brain</Strong>.
          Yesterday's decisions evaporated because nothing wrote them down in a way today's
          session can read.
        </P>

        <H2 id="what-people-try">What people try first (and why it doesn't stick)</H2>
        <P>
          Three common patches, all of which work for about a week:
        </P>
        <Ol>
          <Li>
            <Strong>"Just add it to AGENTS.md / .cursorrules / .clinerules."</Strong> Works
            until your <Code>AGENTS.md</Code> is 800 lines of accumulated rules and the
            agent's context budget says no.
          </Li>
          <Li>
            <Strong>"Tell the agent to write a notes.md at the end of each session."</Strong>{" "}
            Works until a session crashes mid-flight and the notes never get written. Or the
            agent batches three days of work into one note dump and loses the trigger-to-
            decision linkage.
          </Li>
          <Li>
            <Strong>"Just point the agent at the CHANGELOG."</Strong> Works for shipped
            releases. Doesn't help with in-flight decisions, deferred work, or session-level
            "we tried X and rejected it" notes that never warrant a release entry.
          </Li>
        </Ol>
        <P>
          All three share a deeper problem: they treat memory as a side effect of something
          else (rules, sessions, releases) rather than a first-class concern with its own
          discipline.
        </P>

        <H2 id="design">The design that holds up</H2>
        <P>
          After ~50 sessions of trying variants, the shape that survives looks like this.
        </P>

        <H3 id="six-files">Six files, append-only, under one known path</H3>
        <Pre>{`.pi/project/
├── index.md         ← always-loaded router (≤150 lines)
├── charter.md       ← goal, non-goals, quality bar
├── conventions.md   ← always/never rules (incl. anti-stub)
├── decisions.md     ← ADR-lite log: choice, alternatives, consequences
├── backlog.md       ← deferred work, each with a revisit-trigger
└── sessions.md      ← per-session log: goal, status, summary, links
`}</Pre>
        <P>
          The path matters less than the discipline:
        </P>
        <Ul>
          <Li>
            <Strong>Append-only.</Strong> Nothing is edited or deleted. Reversals are new
            entries with <Code>supersedes: &lt;old-id&gt;</Code>. The history of <Em>how</Em>{" "}
            a project changed its mind is as valuable as the current state.
          </Li>
          <Li>
            <Strong>Each entry has a stable id</Strong> (<Code>DEC-001</Code>, <Code>BL-014</Code>,{" "}
            <Code>C-003</Code>, <Code>S-042</Code>). Stable ids let one file reference another
            and let future audits track ripeness.
          </Li>
          <Li>
            <Strong>Each entry has a revisit-trigger.</Strong>{" "}
            <Code>revisit_when: after auth lands</Code> or{" "}
            <Code>revisit_when: if a real user asks</Code>. Without a trigger, the backlog rots.
          </Li>
        </Ul>

        <H3 id="trigger-writes">Trigger-driven writes, not batched flushes</H3>
        <P>
          The agent watches the conversation for trigger phrases and writes the entry{" "}
          <Em>the moment the phrase fires</Em>, not at session end:
        </P>

        <div className="overflow-x-auto mb-6 rounded-2xl border border-slate-border">
          <table className="w-full text-sm">
            <thead className="bg-slate-surface/60">
              <tr className="text-left">
                <th className="p-3 font-semibold text-white">User utterance</th>
                <th className="p-3 font-semibold text-white">Lands in</th>
                <th className="p-3 font-semibold text-white">At</th>
              </tr>
            </thead>
            <tbody className="text-text-muted">
              <tr className="border-t border-slate-border">
                <td className="p-3">"defer X to v2", "out of scope" (with work-noun)</td>
                <td className="p-3"><Code>backlog.md</Code> (BL-NNN)</td>
                <td className="p-3">immediately</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3">"let's go with X over Y" (with technical noun)</td>
                <td className="p-3"><Code>decisions.md</Code> (DEC-NNN)</td>
                <td className="p-3">immediately</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3">"always do X" / "never do Y" / "from now on"</td>
                <td className="p-3"><Code>conventions.md</Code> (C-NNN)</td>
                <td className="p-3">immediately</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3">Goal advanced / milestone hit</td>
                <td className="p-3"><Code>sessions.md</Code> (S-NNN update)</td>
                <td className="p-3">at acknowledgment</td>
              </tr>
            </tbody>
          </table>
        </div>
        <P>
          The "immediately" matters. Sessions crash. Tokens run out. The dog needs to be let
          out. End-of-session batch writes lose data; trigger-moment writes don't. v0.13.2
          formalizes this as the <Strong>"ASSUME INTERRUPTION"</Strong> operating principle —
          treat every turn as potentially the last one before context resets.
        </P>
        <P>
          Three triggers we explicitly <Em>don't</Em> match: bare "later" without a work-noun;
          bare "decided" without a technical noun; compliments without rules. The false-
          positive rate matters more than recall — a brain that writes spurious entries gets
          ignored within a week.
        </P>

        <H3 id="guardrail">A guardrail goal, not a gate</H3>
        <P>
          Every non-trivial session opens with a stated goal:
        </P>
        <Quote>
          Goal: make <Code>notesd list --since=&lt;X&gt;</Code> accept "yesterday", "today",
          and ISO dates.
        </Quote>
        <P>
          The goal is <Strong>not</Strong> a hard gate — refusing off-goal work would be
          tyrannical. It's a guardrail: when an off-goal turn appears, the agent prompts
          "park this, or pivot the session goal?". The user decides. The brain records.
        </P>
        <P>Two things this catches that nothing else catches:</P>
        <Ol>
          <Li>The agent helpfully expanding scope (the "while I'm here, let me refactor X" failure mode).</Li>
          <Li>The user opening a tab on something unrelated and forgetting to close the original goal.</Li>
        </Ol>

        <H3 id="anti-stub">Anti-stub as a first-class convention</H3>
        <P>
          The most pernicious failure mode of agentic coding: code that <Em>looks</Em> done
          but is actually stubs.
        </P>
        <Pre>{`def parse_user_input(text: str) -> User:
    # TODO: implement properly
    return None  # FIXME`}</Pre>
        <P>
          This passes "did the agent finish?" checks because there's a function, there's a
          return statement, there's even a comment. It fails the only check that matters:
          "would this work in production?"
        </P>
        <P>
          The fix is a hard rule (<Code>C-001</Code> in the convention shape above):
        </P>
        <Quote>
          No <Code>TODO</Code> / <Code>FIXME</Code> / <Code>XXX</Code> /{" "}
          <Code>NotImplementedError</Code> / bare-<Code>pass</Code> / stub-returning-
          <Code>null</Code> bodies in shipped code, <Em>ever</Em>.
        </Quote>
        <P>Enforced in two places:</P>
        <Ol>
          <Li>
            <Strong>Worker self-check</Strong> at end of every implementation pass:{" "}
            <Code>{`rg -nP '\\b(TODO|FIXME|XXX)\\b' <touched files>`}</Code>. If hits, the
            worker fixes them before declaring done.
          </Li>
          <Li>
            <Strong>Reviewer hard gate</Strong> before any APPROVE verdict. Same grep, same
            patterns, same allowlist (escape valves for <Em>files that document</Em> the
            rule itself).
          </Li>
        </Ol>
        <P>
          Together these eliminate ~90% of the "looks done, isn't" class of failures.
        </P>

        <H3 id="personas">Sub-agent personas with mandatory project-context primes</H3>
        <P>
          The thing nobody mentions about "delegate to sub-agents" workflows: a{" "}
          <Em>generic</Em> sub-agent fired into your repo answers as if your project didn't
          exist. It cites no decisions. It doesn't know your conventions. It re-invents
          wheels you explicitly rejected three weeks ago.
        </P>
        <P>The fix is custom personas with two mandatory contracts:</P>
        <Ol>
          <Li>
            <Strong>Prime on <Code>.pi/project/index.md</Code> + relevant artifacts before
            producing output.</Strong> Not optional. Hard-coded into the persona's system
            prompt.
          </Li>
          <Li>
            <Strong>Strict structured output template.</Strong> No "well, it depends" prose.
            Bounded budget (≤30 reads, ≤4 web queries, etc.) so the persona doesn't drift
            or time out.
          </Li>
        </Ol>
        <P>Five personas cover the bases:</P>
        <Ul>
          <Li><Code>epicflow-scout</Code> — read-only repo recon, returns a structured brief</Li>
          <Li><Code>epicflow-researcher</Code> — web research with citation requirements (and a <Code>curl</Code> fallback when <Code>pi-web-access</Code> isn't installed)</Li>
          <Li><Code>epicflow-worker</Code> — bounded impl (≤5 files), with anti-stub self-check</Li>
          <Li><Code>epicflow-reviewer</Code> — independent diff review with anti-stub gate</Li>
          <Li><Code>epicflow-oracle</Code> — top-3-risks architectural critique</Li>
        </Ul>
        <Callout kind="win" title="One real example">
          When this design fired for real on a 6-line <Code>parse_since</Code> function in a
          small Python CLI, the scout caught two real footguns the steward had missed (a{" "}
          <Code>fuzzy=True</Code> over-acceptance bug class and a year-rollover ambiguity in
          partial-date inputs). Generic sub-agents don't do this because they don't know
          the project's quality bar.
        </Callout>

        <H2 id="cost">The cost</H2>
        <P>This isn't free.</P>
        <Ul>
          <Li>
            <Strong>You write more.</Strong> Every session opens with a one-sentence goal.
            Every "defer X" produces a paragraph. Every "let's go with X over Y" produces a
            4-section ADR-lite entry. For a 30-minute session, expect ~5 minutes of brain
            writes.
          </Li>
          <Li>
            <Strong>You commit text.</Strong> <Code>.pi/project/</Code> is a real file tree
            under version control. It changes on every meaningful session.
          </Li>
          <Li>
            <Strong>The agent needs a discipline budget.</Strong> Trigger detection takes
            attention. Every turn the agent has to scan the user's utterance against
            trigger patterns.
          </Li>
          <Li>
            <Strong>False positives are expensive.</Strong> The trigger rules have to be
            tight — work-noun co-occurrence required, not bare keyword match.
          </Li>
        </Ul>

        <H2 id="adopt">Whether to adopt it</H2>
        <P>This is overkill for:</P>
        <Ul>
          <Li>Solo single-file scripts where nothing persists across sessions</Li>
          <Li>One-off prototypes you'll throw away within 48 hours</Li>
          <Li>Pure code-review or read-only workflows</Li>
        </Ul>
        <P>It earns its keep when:</P>
        <Ul>
          <Li>You're 2+ weeks into a project and have shipped at least 3 sessions</Li>
          <Li>You're returning to a repo after &gt;1 week and the agent can't reconstruct prior decisions</Li>
          <Li>You've shipped at least one "stub that looked done" bug</Li>
          <Li>You have ≥2 collaborators (human or AI) on the same repo</Li>
        </Ul>
        <P>
          If those describe you, the cost (~5 min/session) is paid back the first time the
          agent doesn't re-ask a question or re-decide a parked design.
        </P>

        <H2 id="see">See it run</H2>
        <P>
          <Code>pi-epicflow</Code> implements all of the above as a <Code>project-memory</Code>{" "}
          skill + 5 custom sub-agent personas + 4 slash commands, shipped as v0.13.0. The
          skill file (
          <a
            className="text-vibrant-green hover:underline"
            href={`${REPO}/blob/main/skills/project-memory/SKILL.md`}
          >
            <Code>SKILL.md</Code>
          </a>
          ) is the canonical spec; it's vendor-neutral enough to port to any agent runtime
          that supports skill autoload and structured sub-agents.
        </P>
        <P>
          The brain on{" "}
          <a
            className="text-vibrant-green hover:underline"
            href={`${REPO}/tree/main/.pi/project`}
          >
            this very repo
          </a>{" "}
          is the result of running the design on itself. It was generated on first run by
          inferring goal, conventions, and decisions from the existing README, CHANGELOG,
          and PLAN files — no manual seeding. The first audit pass found a real pre-
          existing convention violation (one operator script was missing its PowerShell
          mirror) that had escaped twelve prior releases.
        </P>
        <p className="text-white font-semibold text-xl mt-8 leading-relaxed mb-5">
          Memory is the cheapest feature you're not shipping. Ship it.
        </p>

        <div className="mt-16 pt-8 border-t border-slate-border flex flex-wrap gap-3 text-sm text-text-muted">
          <a href="#/blog" className="text-vibrant-green hover:underline inline-flex items-center gap-1">
            <FileCode className="w-4 h-4" />
            All posts
          </a>
          <span className="text-text-muted/50">·</span>
          <a href="#/blog/feature-decomposition" className="text-vibrant-green hover:underline inline-flex items-center gap-1">
            <GitBranch className="w-4 h-4" />
            Read: Feature decomposition
          </a>
          <span className="text-text-muted/50">·</span>
          <a href={`${REPO}#install`} className="text-vibrant-green hover:underline inline-flex items-center gap-1">
            <Flag className="w-4 h-4" />
            Install pi-epicflow
          </a>
          <span className="text-text-muted/50">·</span>
          <a href={`${REPO}`} className="text-vibrant-green hover:underline inline-flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            GitHub
          </a>
        </div>
      </Prose>
    </article>
  );
}
