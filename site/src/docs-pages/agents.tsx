/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Users } from "lucide-react";
import { Prose, H2, H3, P, Strong, Em, Code, Ul, Li, Pre, Callout } from "../blog-posts/_typography";
import { DocHeader, DocFooter } from "./_shared";

type Agent = {
  name: string;
  family: "Project-memory" | "Epic-workflow";
  role: string;
  context: "fresh" | "fork";
  writes: string;
  thinking: "high" | "medium" | "low";
  tools: string;
  whenToUse: string;
  whenNotTo: string;
};

const agents: Agent[] = [
  // Project-memory family (general-purpose) ────────────────────────────────
  {
    name: "epicflow-scout",
    family: "Project-memory",
    role: "Read-only repo recon. Returns a structured brief on how a module / subsystem / pattern works.",
    context: "fresh",
    writes: "None (read-only). Refuses to edit.",
    thinking: "medium",
    tools: "read, grep, find, ls, bash",
    whenToUse: ">5 files to summarize · cross-module &lsquo;how does X work?&rsquo; · sizing a refactor before committing.",
    whenNotTo: "Single-file lookups (just grep) · anything needing writes (use epicflow-worker).",
  },
  {
    name: "epicflow-researcher",
    family: "Project-memory",
    role: "Web research with pi-web-access. Bounded queries, citation-required, refuses if the question is repo-internal.",
    context: "fresh",
    writes: "None.",
    thinking: "medium",
    tools: "read, grep, bash, web_search, code_search, fetch_content",
    whenToUse: ">2 web sources needed · current docs / release notes / version-specific behavior / RFCs · library examples.",
    whenNotTo: "Repo-internal questions (use scout) · single Stack Overflow lookup (just web yourself).",
  },
  {
    name: "epicflow-worker",
    family: "Project-memory",
    role: "Concrete implementation of a bounded task. Mandatory plan-before-edit, anti-stub self-check, ≤5 files per invocation, refuses on over-scope.",
    context: "fresh",
    writes: "Source files in scope (≤5). Returns structured diff summary.",
    thinking: "high",
    tools: "read, grep, bash, edit, write, contact_supervisor",
    whenToUse: ">1 file or >~50 LOC · needs research before edit · main session would lose context.",
    whenNotTo: "Trivial one-file fixes · anything needing user clarification mid-stream (use main session).",
  },
  {
    name: "epicflow-reviewer",
    family: "Project-memory",
    role: "Independent pre-commit / pre-merge review of a diff against the session goal, conventions, and anti-stub rules.",
    context: "fresh",
    writes: "Returns PASS/FAIL with `file:line` findings. Small corrective edits allowed.",
    thinking: "high",
    tools: "read, grep, bash, edit",
    whenToUse: "Before committing a non-trivial diff · before merging any branch · whenever the main session wrote &amp; reviewed (avoid same-context self-review).",
    whenNotTo: "Already-merged diffs · doc-only diffs.",
  },
  {
    name: "epicflow-oracle",
    family: "Project-memory",
    role: "Architectural critique and second-opinion on a plan / design / risky decision. Returns top-3 risks, alternatives, recommendation.",
    context: "fresh",
    writes: "None (read-only). Can run async.",
    thinking: "high",
    tools: "read, grep, bash, web_search, fetch_content",
    whenToUse: "Risky architectural call · before committing to a design that&apos;s hard to reverse · when you suspect tunnel vision.",
    whenNotTo: "Tactical questions (use scout) · time-sensitive (oracle takes thinking time).",
  },
  {
    name: "epicflow-steward",
    family: "Project-memory",
    role: "Unattended project-memory hygiene. Audits brain, promotes ripe items, flags rollover. Write-allowlisted to `.pi/project/` + `~/.pi/global-memory/` only.",
    context: "fresh",
    writes: "ONLY `.pi/project/*.md`, `.pi/project/modules/*.md`, `.pi/project/*-archive-*.md`, `~/.pi/global-memory/*.md`. Refuses every other path.",
    thinking: "medium",
    tools: "read, grep, bash, edit, write",
    whenToUse: "/project-review delegation · multi-repo brain sweeps · routine hygiene you don&apos;t want to do interactively.",
    whenNotTo: "Anything that touches code (refuses) · anything that touches git (refuses).",
  },

  // Epic-workflow family (specialized) ────────────────────────────────────
  {
    name: "feature-planner",
    family: "Epic-workflow",
    role: "Pre-implementation planner for one epic-feature flagged `needs_planner`. Produces a binding `plan.md` the worker honors as a contract.",
    context: "fresh",
    writes: "Writes `plan.md` only. Does NOT edit code.",
    thinking: "high",
    tools: "read, grep, bash, contact_supervisor",
    whenToUse: "Spawned by /epic-run-auto when a feature&apos;s `needs_planner: true`. Not invoked directly.",
    whenNotTo: "Features small enough to skip planning (set `needs_planner: false` in decomposition.yaml).",
  },
  {
    name: "feature-worker",
    family: "Epic-workflow",
    role: "Implements exactly ONE feature inside its assigned git worktree. Ends at tests-passing + anti-stub clean. Returns structured `worker-report.md`.",
    context: "fresh",
    writes: "Only files in feature&apos;s declared `scope_files`. Out-of-scope edit → halt H2.",
    thinking: "high",
    tools: "read, grep, bash, edit, write, contact_supervisor",
    whenToUse: "Spawned by /epic-run-auto for every feature. Not invoked directly.",
    whenNotTo: "Outside an epic context (use epicflow-worker).",
  },
  {
    name: "feature-reviewer",
    family: "Epic-workflow",
    role: "Independent pre-merge review of ONE feature&apos;s diff against its acceptance criteria. Read-only by default; small corrective edits allowed.",
    context: "fresh",
    writes: "Returns APPROVE / NEEDS_CHANGES / REJECT with `file:line` findings.",
    thinking: "high",
    tools: "read, grep, bash, edit, write",
    whenToUse: "Spawned by /epic-run-auto after every feature-worker finishes. Not invoked directly.",
    whenNotTo: "Cumulative review of an entire epic (use feature-epic-reviewer).",
  },
  {
    name: "feature-epic-reviewer",
    family: "Epic-workflow",
    role: "Independent cross-feature review of an entire epic branch before `pi-epic-complete` archives it. Catches bugs per-feature reviewers cannot see by design.",
    context: "fresh",
    writes: "Returns APPROVE_EPIC / NEEDS_CHANGES / REJECT. Only `.pi/epics/<id>/` edits allowed.",
    thinking: "high",
    tools: "read, grep, bash, edit, write",
    whenToUse: "Spawned by /epic-run-auto right before pi-epic-complete. Not invoked directly.",
    whenNotTo: "Per-feature review (use feature-reviewer).",
  },
  {
    name: "epic-design-critic",
    family: "Epic-workflow",
    role: "Unbiased pre-commit critique of an epic&apos;s `design.md`. Senior-staff-engineer stance, walks a quality-attribute checklist, emits severity-tagged findings.",
    context: "fresh",
    writes: "None (read-only).",
    thinking: "high",
    tools: "read, grep, find, ls, bash",
    whenToUse: "Spawned by /epic-review-design before decomposition. High-stakes designs only &mdash; opt-in.",
    whenNotTo: "Routine designs · designs you already trust.",
  },
];

const families: Array<Agent["family"]> = ["Project-memory", "Epic-workflow"];

const familyBlurb: Record<Agent["family"], string> = {
  "Project-memory":
    "General-purpose personas the main pi session delegates to during routine work. You invoke them directly via `subagent({agent: 'name', task: '...'})` or via the slash commands.",
  "Epic-workflow":
    "Specialized personas spawned by the /epic-run-auto orchestrator. You don&apos;t typically invoke these directly &mdash; they&apos;re the internal machinery of an epic run.",
};

export default function AgentsPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <DocHeader
        eyebrow="Internals"
        Icon={Users}
        title="Personas (sub-agents)"
        subtitle={
          <>
            All 11 sub-agent personas that ship with pi-epicflow. Every
            persona runs in a <Em>fresh context</Em> by default &mdash; that
            independence is what makes parallel epic features, unbiased
            review, and safe delegated brain sweeps possible.
          </>
        }
      />
      <Prose>
        <H2>Why fresh-context personas instead of one big agent</H2>
        <P>
          Three reasons. <Strong>(1) Token budget stays bounded</Strong> &mdash;
          each persona reads only what its job needs. <Strong>(2) Parallelism is free</Strong>{" "}
          &mdash; independent personas run concurrently without stepping on
          each other. <Strong>(3) Independence is the review</Strong> &mdash;
          a reviewer that didn&apos;t produce the diff catches things the
          author cannot.
        </P>

        <Callout kind="info" title="Install location">
          All 11 personas live at <Code>agents/*.md</Code> in the repo and
          are copied to <Code>~/.pi/agent/agents/</Code> by postinstall.
          The system prompts are <Em>part of the contract</Em> &mdash; if a
          persona surprises you, read its <Code>.md</Code> file first.
        </Callout>

        {families.map((fam) => (
          <div key={fam} className="mb-10">
            <H2>{fam} family</H2>
            <P>
              <span dangerouslySetInnerHTML={{ __html: familyBlurb[fam] }} />
            </P>
            <div className="space-y-5">
              {agents
                .filter((a) => a.family === fam)
                .map((a) => (
                  <div
                    key={a.name}
                    className="rounded-2xl border border-slate-border bg-slate-surface/40 p-5"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
                      <code className="text-vibrant-green font-mono text-lg font-bold">
                        {a.name}
                      </code>
                      <span className="text-xs font-mono uppercase tracking-wider text-text-muted/70 ml-auto">
                        ctx: {a.context} &middot; thinking: {a.thinking}
                      </span>
                    </div>
                    <P>
                      <span dangerouslySetInnerHTML={{ __html: a.role }} />
                    </P>
                    <div className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-sm mb-2">
                      <Strong>Tools:</Strong>
                      <code className="text-text-muted font-mono text-xs">{a.tools}</code>
                      <Strong>Writes:</Strong>
                      <span className="text-text-muted">
                        <span dangerouslySetInnerHTML={{ __html: a.writes }} />
                      </span>
                      <Strong>Use when:</Strong>
                      <span className="text-text-muted">
                        <span dangerouslySetInnerHTML={{ __html: a.whenToUse }} />
                      </span>
                      <Strong>Not when:</Strong>
                      <span className="text-text-muted">
                        <span dangerouslySetInnerHTML={{ __html: a.whenNotTo }} />
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}

        <H2>Calling a persona directly</H2>
        <P>
          From the main pi session (any persona in the project-memory
          family, plus <Code>epicflow-steward</Code>):
        </P>
        <Pre>{`subagent({
  agent: "epicflow-scout",
  task: "Map the storage layer: which modules read/write JSONL, what's the
         entry point, where does XDG_DATA_HOME resolution happen?",
})

subagent({
  agent: "epicflow-oracle",
  task: "We're considering switching from JSONL to SQLite for the storage
         layer. Read DEC-001 and the storage.py module. Top 3 risks of
         the migration; recommendation.",
})

subagent({
  agent: "epicflow-steward",
  task: "Read-only audit of .pi/project/. Surface ripe BL items, stale
         entries, and any rollover candidates. Do not edit anything.",
})`}</Pre>

        <H3>Sub-agent priming</H3>
        <P>
          Every <Code>epicflow-*</Code> persona has a <Strong>mandatory prime</Strong>:
          before doing anything else, it reads <Code>.pi/project/index.md</Code>{" "}
          and follows the routing table to load the right artifacts.
          That&apos;s why brain-aware delegation works &mdash; the persona
          inherits your project&apos;s charter, conventions, and prior
          decisions without you having to copy-paste them into the task.
        </P>

        <H2>Related</H2>
        <Ul>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/skills">Skills</a> &mdash; the two skills that autoload + reference these personas.</Li>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/commands">Slash commands</a> &mdash; which commands spawn which personas.</Li>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/brain">Brain artifacts</a> &mdash; what the personas prime on.</Li>
        </Ul>

        <DocFooter />
      </Prose>
    </article>
  );
}
