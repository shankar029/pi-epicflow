/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Terminal } from "lucide-react";
import { Prose, H2, P, Strong, Code, Ul, Li, Pre, Callout } from "../blog-posts/_typography";
import { DocHeader, DocFooter } from "./_shared";

type Cmd = {
  name: string;
  args: string;
  pillar: "Project memory" | "Epic workflow";
  once: string;
  what: string;
  produces: string;
  exampleIn: string;
  exampleOut: string;
};

const cmds: Cmd[] = [
  {
    name: "/project-init",
    args: "[--auto-commit]",
    pillar: "Project memory",
    once: "Once per repo",
    what: "Interview-driven scaffold of `.pi/project/` (9 files). Auto-skips files that already exist.",
    produces: "9 brain artifacts + AGENTS.md reference + S-001 opened in sessions.md",
    exampleIn: "/project-init",
    exampleOut: `pi  ▸ I'll scaffold .pi/project/ with 9 files. Quick interview:
        1. One-sentence goal? 2. Two non-goals? 3. Quality bar?
[...drafts charter, conventions, decisions, etc...]
✅ 9 brain files committed. S-001 opened.`,
  },
  {
    name: "/project-init-global",
    args: "(no args)",
    pillar: "Project memory",
    once: "Once per user account",
    what: "Idempotent scaffold of the cross-repo overlay at `~/.pi/global-memory/`. Refuses to overwrite existing files. Per-repo brain always wins on conflict.",
    produces: "index.md, conventions.md, decisions.md (optionally charter.md) in `~/.pi/global-memory/`",
    exampleIn: "/project-init-global",
    exampleOut: `pi  ▸ Owner? (defaults to $USER)
you ▸ Shankar B.
pi  ▸ Charter file? (recommend "no" for first-time setup)
you ▸ no
pi  ▸ ✅ ~/.pi/global-memory/ initialized.`,
  },
  {
    name: "/project-onboard",
    args: "(no args)",
    pillar: "Project memory",
    once: "On demand (warm-up)",
    what: "5-line orientation summary at session start. Reads index + last 3 decisions + open backlog + last 3 sessions. Optional &mdash; the skill primes automatically anyway.",
    produces: "Inline summary; no writes",
    exampleIn: "/project-onboard",
    exampleOut: `Charter: notes daemon, single-user, HTTP+JSONL.
Recent decisions: DEC-005 (CSV export), DEC-006 (FTS index choice).
Open backlog: BL-007 (FTS), BL-009 (TUI client).
Last session: S-022 — export command, achieved 2026-05-24.
Ready for goal.`,
  },
  {
    name: "/project-review",
    args: "[--quiet]",
    pillar: "Project memory",
    once: "Weekly-ish",
    what: "Audits A-0..A-8: staleness, ripe backlog, convention drift, capacity, etc. Read-only by default; surfaces recommendations for user to approve. Optionally delegates to `epicflow-steward`.",
    produces: "Steward report with findings + recommendations. No edits without user approval.",
    exampleIn: "/project-review",
    exampleOut: `A-2 Backlog ripeness: 1 ripe (BL-007 — 3 cross-session refs)
A-7 Index staleness: 2 weeks behind file mtimes
A-8 Capacity: backlog 18/200, decisions 7/500 — under caps
Recommendations: (1) promote BL-007 → /epic-design (2) refresh index`,
  },
  {
    name: "/session-end",
    args: "[achieved|paused|abandoned] [reason]",
    pillar: "Project memory",
    once: "On demand",
    what: "Manual force-close of the current in-progress session. Normally pi proposes closure autonomously; this is the escape hatch when you&apos;re stopping early.",
    produces: "Flips Status: in-progress → status of choice; appends closing fields below.",
    exampleIn: '/session-end paused "out of time, picking up Monday"',
    exampleOut: `[closes S-024 with status: paused]
Closed S-024. Pickup hints: storage_test.py:43 (assertion).`,
  },
  {
    name: "/epic-design",
    args: "[--from=<path>...] [--skip-review-hint]",
    pillar: "Epic workflow",
    once: "Per epic (Step 1 of 3)",
    what: "Co-authors `design.md` for the active epic. Ingests `--from` requirements drafts, asks gap questions with recommendations, then writes + commits to the epic branch.",
    produces: ".pi/epics/<id>/design.md (committed)",
    exampleIn: "/epic-design --from /tmp/api-brd.md",
    exampleOut: `pi  ▸ Ingested BRD. Honoring from brain:
        - charter non-goals (no multi-tenant, no sync)
        - DEC-001 (append-only JSONL)
      Draft §1 outline, or want to give me §1 yourself?`,
  },
  {
    name: "/epic-review-design",
    args: "[--auto-apply-must-fix]",
    pillar: "Epic workflow",
    once: "Per epic (optional, after /epic-design)",
    what: "Spawns `epic-design-critic` in a fresh context for unbiased pre-commit critique. Walks structured findings with you, applies fixes you approve, commits.",
    produces: "Updated design.md + critique transcript in the epic dir",
    exampleIn: "/epic-review-design",
    exampleOut: `Critic found:
  MUST-FIX (1): §4 AC for rate-limit is unmeasurable
  SHOULD-FIX (2): §3 non-scope missing for legacy SDK
  CONSIDER (3): §6 risk for cold-start cache stampede
Apply must-fix and re-commit? (y/N)`,
  },
  {
    name: "/epic-decompose",
    args: "[--features=N] [--auto-commit]",
    pillar: "Epic workflow",
    once: "Per epic (Step 2 of 3)",
    what: "Turns `design.md` into a dependency-ordered DAG of small features written to `decomposition.yaml`. Validates, then commits when you approve. Reads `lessons.md` to honor prior epic learnings.",
    produces: ".pi/epics/<id>/decomposition.yaml (committed)",
    exampleIn: "/epic-decompose",
    exampleOut: `Proposed 5 features:
  F01 http-server-skeleton ──┐
  F02 post-note-endpoint     ├── F04 list-notes
  F03 get-note-endpoint     ──┘     │
                                     ▼
                              F05 integration-tests
Approve, re-decompose, or want different cuts?`,
  },
  {
    name: "/epic-run-auto",
    args: "[--max-features=N] [--no-reviewer] [--no-bootstrap]",
    pillar: "Epic workflow",
    once: "Per epic (Step 3 of 3)",
    what: "Runs the auto-mode loop. Delegates each feature to a `feature-worker` subagent; gates squash-merges with `feature-reviewer`; runs `feature-epic-reviewer` before final archive. Halts on H1–H7; resumable.",
    produces: "Merged epic branch + PR command printed at end. Halt reports if blocked.",
    exampleIn: "/epic-run-auto",
    exampleOut: `[spawns F01 worker → reviewer → merge]
[spawns F02 + F03 in parallel...]
[feature-epic-reviewer: APPROVE_EPIC]
Epic 0001-http-api complete. PR command:
  gh pr create --base main --head epic/0001-http-api ...`,
  },
];

export default function CommandsPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <DocHeader
        eyebrow="Surfaces"
        Icon={Terminal}
        title="Slash commands"
        subtitle={
          <>
            All 9 slash commands you can invoke from inside <Code>pi</Code>.
            Project-memory commands run sparingly (mostly setup + weekly
            audit); epic-workflow commands are the three-step ritual that
            ships every multi-feature epic.
          </>
        }
      />
      <Prose>
        <P>
          At a glance: 5 commands for pillar 2 (project memory), 4 for
          pillar 1 (epic workflow). Routine work needs none of them &mdash;
          trigger phrases handle the brain automatically and small features
          don&apos;t need an epic.
        </P>

        <H2>The 9 commands</H2>

        <div className="space-y-6">
          {cmds.map((c) => (
            <div
              key={c.name}
              className="rounded-2xl border border-slate-border bg-slate-surface/40 p-5"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                <code className="text-vibrant-green font-mono text-lg font-bold">
                  {c.name}
                </code>
                <code className="text-text-muted/80 font-mono text-xs">
                  {c.args}
                </code>
                <span className="text-xs font-mono uppercase tracking-wider text-amber-300/80 ml-auto">
                  {c.pillar} &middot; {c.once}
                </span>
              </div>
              <P>
                <span dangerouslySetInnerHTML={{ __html: c.what }} />
              </P>
              <div className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-sm mb-3">
                <Strong>Produces:</Strong>
                <span className="text-text-muted">{c.produces}</span>
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer text-vibrant-green hover:underline mb-2">
                  Example
                </summary>
                <Pre>{`you ▸ ${c.exampleIn}
${c.exampleOut}`}</Pre>
              </details>
            </div>
          ))}
        </div>

        <H2>Discovery</H2>
        <P>
          Postinstall registers every <Code>prompts/*.md</Code> file with
          pi, so all 9 commands appear in pi&apos;s command palette
          (<Code>/</Code>) automatically after install. A new prompt added
          in a future release is auto-discovered on the next install.
        </P>

        <H2>Authoritative source</H2>
        <Callout kind="info" title="Where to find the exact prompt">
          Each command&apos;s system prompt lives at <Code>prompts/&lt;name&gt;.md</Code>
          in the repo. Open it to see the precise instructions the agent
          loads when you type the slash command &mdash; including every
          guardrail, every output format, every refusal rule.
        </Callout>

        <H2>Related</H2>
        <Ul>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/scripts">CLI scripts</a> &mdash; the shell scripts these slash commands delegate to.</Li>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/agents">Personas</a> &mdash; the sub-agents <Code>/epic-run-auto</Code> and <Code>/epic-review-design</Code> spawn.</Li>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/triggers">Trigger phrases</a> &mdash; how the brain grows without any slash commands.</Li>
        </Ul>

        <DocFooter />
      </Prose>
    </article>
  );
}
