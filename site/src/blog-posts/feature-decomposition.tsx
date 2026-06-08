/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import {
  GitBranch,
  Layers,
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

export default function FeatureDecompositionPost() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <div className="inline-flex items-center gap-2 bg-vibrant-green/10 text-vibrant-green text-xs font-bold font-mono px-3 py-1 rounded-full border border-vibrant-green/20 mb-5 uppercase tracking-widest">
          <Layers className="w-3 h-3" />
          Epic workflow
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
          Feature decomposition: turning <span className="text-vibrant-green">design.md</span> into a parallel DAG
        </h1>
        <p className="text-text-muted text-lg leading-relaxed mb-6">
          Why <Code>/epic-decompose</Code> splits one design into 3–60 small features with explicit
          dependencies, and how worker subagents in clean worktrees ship them faster than one
          heroic context ever could.
        </p>
        <div className="text-sm text-text-muted/70 font-mono">
          2026-05-24 · 8 min read
        </div>
      </motion.header>

      <Prose>
        <P>
          The naive way to use a coding agent on a multi-feature deliverable is to drop a long
          design document into one chat and say "build this." Six features in, the agent is
          dragging 80&nbsp;KB of context around, confidently misremembering decisions it made
          two hours ago, and edits to feature&nbsp;F02 are silently bleeding into feature&nbsp;F05.
          The output looks fine until you try to review it.
        </P>
        <P>
          <Code>pi-epicflow</Code> attacks that failure mode from the structure side, not the
          prompt-engineering side. The first command in the flow,{" "}
          <Code>/epic-decompose</Code>, reads your <Code>design.md</Code> and produces a
          dependency-ordered DAG of small features. The next command, <Code>/epic-run-auto</Code>,
          ships them in topological batches — each feature on its own git worktree, in its own
          fresh agent context, with a strict review gate before merge. One reviewable PR comes
          out the other end.
        </P>
        <P>
          This post walks through what decomposition actually does, the seven-signal test that
          decides which features get a dedicated planner pass, and the halt protocol that keeps
          the orchestrator honest when the plan disagrees with reality.
        </P>

        <H2 id="why-dag">Why a DAG and not a checklist</H2>
        <P>
          A flat checklist hides three things you really want to see: <Strong>what can run in
          parallel</Strong>, <Strong>what must wait</Strong>, and <Strong>where a single
          delayed feature blocks everything downstream</Strong>. A DAG makes all three explicit.
        </P>
        <P>
          <Code>/epic-decompose</Code> writes the result to{" "}
          <Code>.pi/epics/&lt;id&gt;/decomposition.yaml</Code>. The shape is intentionally
          boring:
        </P>
        <Pre>{`features:
  - id: F01
    title: Add JSON schema for /v1/orders
    depends_on: []
    scope: orders-api/schema/
    acceptance:
      - schema validates the 12 examples in design.md §3.2
      - existing tests still pass
    needs_planner: false

  - id: F02
    title: Wire /v1/orders POST handler to schema
    depends_on: [F01]
    scope: orders-api/handlers/orders.py
    acceptance:
      - 400 on schema-invalid bodies, with the field path in the error
      - 201 + Location header on valid create
    needs_planner: true   # acceptance test is format-sensitive

  - id: F03
    title: Idempotency-Key middleware
    depends_on: [F02]
    needs_planner: true   # scope crosses 3 modules

  # ... up to 60 features
`}</Pre>
        <P>
          Once the DAG is approved, <Code>/epic-run-auto</Code> walks it in topological batches.
          Features in the same batch have no dependency on each other, so they're shipped in
          parallel — each in its own git worktree off the long-lived <Code>epic/&lt;slug&gt;</Code>{" "}
          branch.
        </P>
        <Callout kind="info" title="Why git worktrees, not branches in one tree">
          Worker subagents get their own working directory. Two workers can't accidentally fight
          over an unstaged file, and a panic-quit on one worker can't leave a half-applied diff
          in another. <Code>pi-epic-init-feature</Code> sets the worktree up; <Code>pi-epic-complete-feature</Code>{" "}
          squash-merges back and removes it.
        </Callout>

        <H2 id="three-roles">Three roles, three contexts, three budgets</H2>
        <P>
          Each feature runs through up to three subagent invocations, each in a{" "}
          <Strong>fresh pi context</Strong> with its own bounded budget:
        </P>
        <Ol>
          <Li>
            <Strong>Planner (optional).</Strong> If the feature is tagged{" "}
            <Code>needs_planner: true</Code>, a <Code>feature-planner</Code> subagent reads the
            design, the decomposition entry, any referenced existing code, and writes a binding{" "}
            <Code>plan.md</Code>. The worker treats that plan as a contract.
          </Li>
          <Li>
            <Strong>Worker.</Strong> A <Code>feature-worker</Code> subagent implements the
            feature inside its worktree. It must produce concrete code — no <Code>TODO</Code>,
            no <Code>FIXME</Code>, no <Code>NotImplementedError</Code>, no bare <Code>pass</Code>{" "}
            bodies — and ends at tests-passing + self-review clean.
          </Li>
          <Li>
            <Strong>Reviewer.</Strong> A <Code>feature-reviewer</Code> subagent reviews the diff
            against the acceptance criteria, the plan (if any), and the anti-stub rule. It's
            read-only by default; small corrective edits are allowed but stay inside the
            worktree.
          </Li>
        </Ol>
        <P>
          The point isn't agent diversity — it's <Strong>context isolation</Strong>. F03's
          worker doesn't see F01's worker's 80&nbsp;KB of debugging context, and the reviewer
          doesn't see the worker's exploratory dead ends. Each role gets exactly the slice of
          truth it needs.
        </P>

        <H2 id="needs-planner">The seven-signal planner test</H2>
        <P>
          Tagging every feature <Code>needs_planner: true</Code> is expensive and slow. Tagging
          none of them invites worker drift on the features that actually need an upfront
          contract. <Code>/epic-decompose</Code> applies a deterministic seven-signal checklist:
        </P>
        <Ol>
          <Li>
            <Strong>Format-sensitive acceptance.</Strong> Tests assert exact JSON structure,
            exact wire format, exact log line — the kind of thing a worker can pass by accident
            and fail two layers later.
          </Li>
          <Li>
            <Strong>Scope crosses ≥ 3 modules.</Strong> Cross-cutting changes need a written
            seam-and-contract map before the worker starts inventing one.
          </Li>
          <Li>
            <Strong>Dependency chain depth ≥ 4.</Strong> Workers that build on three other
            features benefit from explicit "here's what those gave you" priming.
          </Li>
          <Li>
            <Strong>Existing-code overlap is large.</Strong> When the feature reshapes 200+
            lines of existing code, a plan up-front prevents the worker from rewriting more
            than it should.
          </Li>
          <Li>
            <Strong>Failure modes are listed in design.md.</Strong> If the design enumerates
            specific failure conditions, the planner maps each one to a test case so the worker
            can't skip them.
          </Li>
          <Li>
            <Strong>Performance / resource constraints in AC.</Strong> Workers reliably write
            correct-but-slow code on first pass. The planner picks the right approach before
            the worker burns a turn.
          </Li>
          <Li>
            <Strong>The feature is the first to touch a new dependency.</Strong> Library
            integrations need a "we'll use X with Y options because Z" decision before any
            <Code>import</Code> line.
          </Li>
        </Ol>
        <P>
          Any single signal flips <Code>needs_planner</Code> to <Code>true</Code>. The bar is
          intentionally low: a small planner pass is cheap; an over-confident worker on a
          subtle feature is expensive.
        </P>

        <H2 id="halts">Halts, not heroics</H2>
        <P>
          The hardest design choice in <Code>pi-epicflow</Code> was the halt protocol. Eight
          well-defined codes — <Code>H1</Code>–<Code>H7</Code>, <Code>H9</Code> — cover the
          situations where the orchestrator <Em>should not guess</Em>:
        </P>
        <Ul>
          <Li>
            <Strong>H1</Strong> — feature acceptance is genuinely ambiguous after re-reading
            design.md.
          </Li>
          <Li>
            <Strong>H2</Strong> — the worker hit a test failure it cannot explain without
            domain knowledge it doesn't have.
          </Li>
          <Li>
            <Strong>H3</Strong> — the diff exceeds the soft size cap and reviewing it would
            burn 30+&nbsp;min of context.
          </Li>
          <Li>
            <Strong>H4–H7, H9</Strong> — merge conflict the worker can't resolve safely,
            external dependency unreachable, schema drift, etc.
          </Li>
        </Ul>
        <P>
          When any halt fires, the orchestrator writes a halt report to{" "}
          <Code>.pi/epics/&lt;id&gt;/halts/&lt;feature&gt;-&lt;code&gt;.md</Code> with the exact
          resume command, then stops. <Strong>A bad guess at hour 3 wastes hours; a halt loses
          minutes.</Strong>
        </P>
        <Quote>
          The orchestrator is a project manager, not a hero. The right answer to "the plan
          doesn't match reality" is to surface it, not to plough through.
        </Quote>

        <H2 id="deviations">Deviations become next-epic priors</H2>
        <P>
          When a worker can't honor the plan exactly — maybe the planner missed a constraint,
          or the world changed between plan and impl — it appends a <Code>deviations.md</Code>{" "}
          entry. Every deviation is a first-class diff against the plan: what was promised,
          what shipped, why.
        </P>
        <P>
          At <Code>pi-epic-complete</Code> time, the deviations get distilled into{" "}
          <Code>lessons.md</Code> entries (the <Code>L-NNN</Code> shape you'll see throughout
          the project's brain). The next epic's decomposition reads those lessons and biases
          the planner toward not repeating the same mistake. That's how the system gets
          smarter without anyone explicitly tuning a prompt.
        </P>

        <H2 id="size">When does this actually help?</H2>
        <P>
          For a one-file change, decomposition is overkill. The break-even point is somewhere
          around the third feature — at which point you start paying for context bloat with
          one of the failure modes that motivated this whole design.
        </P>
        <P>
          Where it earns its keep:
        </P>
        <Ul>
          <Li>
            <Strong>3+ features with explicit dependencies.</Strong> The DAG saves you from
            shipping F03 before F01's contract is real.
          </Li>
          <Li>
            <Strong>Cross-cutting refactors.</Strong> Each "rename + adjust callers" feature
            ships in clean isolation.
          </Li>
          <Li>
            <Strong>Long-running epics you want to walk away from.</Strong> The halt protocol
            means resuming tomorrow doesn't require re-reading 2&nbsp;hours of yesterday's
            conversation.
          </Li>
        </Ul>

        <H2 id="links">Where to look next</H2>
        <P>
          Three pointers if you want to go deeper:
        </P>
        <Ul>
          <Li>
            <a
              className="text-vibrant-green hover:underline"
              href={`${REPO}/blob/main/skills/epic-feature-workflow/SKILL.md`}
            >
              <Code>skills/epic-feature-workflow/SKILL.md</Code>
            </a>{" "}
            — the canonical rules, including all halt codes and the per-role contracts.
          </Li>
          <Li>
            <a
              className="text-vibrant-green hover:underline"
              href="#/quickstart"
            >
              Quickstart
            </a>{" "}
            — three commands to install, three commands to ship your first epic.
          </Li>
          <Li>
            <a className="text-vibrant-green hover:underline" href="#/blog/project-memory">
              The companion post on project memory
            </a>{" "}
            — how v0.13's persistent brain keeps decisions across sessions so the next epic
            inherits the right context.
          </Li>
        </Ul>

        <div className="mt-16 pt-8 border-t border-slate-border flex flex-wrap gap-3 text-sm text-text-muted">
          <a href="#/blog" className="text-vibrant-green hover:underline inline-flex items-center gap-1">
            <GitBranch className="w-4 h-4" />
            All posts
          </a>
          <span className="text-text-muted/50">·</span>
          <a href={`${REPO}#install`} className="text-vibrant-green hover:underline inline-flex items-center gap-1">
            <Flag className="w-4 h-4" />
            Install pi-epicflow
          </a>
          <span className="text-text-muted/50">·</span>
          <a href={`${REPO}`} className="text-vibrant-green hover:underline inline-flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            View on GitHub
          </a>
        </div>
      </Prose>
    </article>
  );
}
