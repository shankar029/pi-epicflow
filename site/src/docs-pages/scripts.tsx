/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Terminal } from "lucide-react";
import { Prose, H2, H3, P, Strong, Em, Code, Ul, Li, Pre, Callout } from "../blog-posts/_typography";
import { DocHeader, DocFooter } from "./_shared";

type Script = {
  name: string;
  args: string;
  what: string;
  fails: string;
  exits: string;
};

const scripts: Script[] = [
  {
    name: "pi-epic-init",
    args: "<slug> [--from <design-file>] [--title \"<title>\"] [--base <branch>] [--no-planner]",
    what: "Bootstrap an epic: scaffolds `.pi/epics/<NNNN>-<slug>/` from template, creates `epic/<slug>` branch off the default branch, sets STATE.md, optionally seeds design.md from a `--from` file. Picks the next free NNNN automatically.",
    fails: "Not in a git repo · slug already exists · default branch unresolvable",
    exits: "0 OK · 1 invalid args · 2 git/repo error · 3 epic already exists",
  },
  {
    name: "pi-epic-extend",
    args: "<id> --rationale \"<one-liner>\" [--design <file>] [--title \"<short>\"]",
    what: "Extend an existing epic with new requirements that belong to its original scope. Use when an epic shipped a framework/API surface and the only honest way to verify it is to ship a sample/consumer that exercises it.",
    fails: "Epic not found · missing --rationale · epic already complete",
    exits: "0 OK · 1 invalid args · 4 epic not found",
  },
  {
    name: "pi-epic-status",
    args: "[--ready [--quiet]] [--json]",
    what: "Read-only status for the active epic. Default: epic meta + DAG with per-feature state + runlog tail + halts + batch summary. `--ready` prints just the next-ready feature IDs. `--json` for machine-readable.",
    fails: "No active epic · STATE.md missing",
    exits: "0 OK · 5 no active epic",
  },
  {
    name: "pi-epic-next-feature",
    args: "(no args)",
    what: "Prints the next ready feature ID for the active epic, or `DONE` (all merged) or `HALT:<reason>`. A feature is ready iff: not merged, not halted, all dependencies merged, no same-file scope collision with a running peer.",
    fails: "No active epic",
    exits: "0 OK · 5 no active epic",
  },
  {
    name: "pi-epic-validate-decomposition",
    args: "(no args)",
    what: "Validates the active epic&apos;s `decomposition.yaml`: required fields present, IDs sequential (F01, F02&hellip;), `depends_on` references valid, no cycles, no scope-file overlap on parallel-eligible features, integration shell present if declared.",
    fails: "decomposition.yaml missing · YAML parse error · cycle · invalid dep ref · scope collision",
    exits: "0 OK · 6 invalid decomposition",
  },
  {
    name: "pi-feature-start",
    args: "<feature-id>",
    what: "Verifies feature deps are merged · creates `feat/<epic-slug>/<feature-id>-<slug>` branch off the epic branch · creates a git worktree at `../<repo>-<feature-id>/` · scaffolds `feature.md` + `meta.yaml` · updates STATE.md.",
    fails: "Deps not merged · branch already exists · worktree path conflicts · dirty epic branch",
    exits: "0 OK · 7 deps not merged · 8 worktree conflict",
  },
  {
    name: "pi-feature-complete",
    args: "<feature-id> [--skip-tests] [--skip-evidence]",
    what: "Verifies you&apos;re in the feature worktree on the feature branch · runs build/test (autodetected or from `epic-config.yaml`) unless `--skip-tests` · verifies `worker-report.md` has a Completion evidence section · squash-merges into the epic branch · removes worktree + branch · updates STATE.md.",
    fails: "Wrong worktree · tests failing · missing evidence · merge conflict",
    exits: "0 OK · 9 tests failing · 10 evidence missing · 11 merge conflict",
  },
  {
    name: "pi-epic-complete",
    args: "[--no-pr] [--draft]",
    what: "Final shipping ritual: verifies all features merged or halted · rebases epic onto latest default branch · runs full test suite · optional E2E gate (H11) · distills `deviations.md` → `lessons-candidate.md` for review then commits as `lessons.md` · pushes epic branch · prints `gh pr create` command (or skips with `--no-pr`).",
    fails: "Features unfinished · rebase conflict · tests failing · E2E gate failed",
    exits: "0 OK · 9 tests failing · 12 epic incomplete · 13 E2E gate failed",
  },
  {
    name: "pi-epicflow-doctor",
    args: "(no args)",
    what: "Read-only health report: pi-epicflow install presence + version + age, skills installed + executable, agents installed in `~/.pi/agent/agents/`, active epic state, recent epic activity, anti-stub grep state, smoke-test recipe.",
    fails: "Nothing &mdash; doctor always exits 0 and reports findings",
    exits: "0 (always)",
  },
];

export default function ScriptsPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <DocHeader
        eyebrow="Surfaces"
        Icon={Terminal}
        title="CLI scripts"
        subtitle={
          <>
            9 shell scripts (bash + PowerShell mirrors at{" "}
            <Code>skills/epic-feature-workflow/scripts-win/*.ps1</Code>). They&apos;re
            what the slash commands and orchestrator delegate to. You can
            also call them directly from a terminal &mdash; useful for
            scripted workflows or CI.
          </>
        }
      />
      <Prose>
        <H2>Install location</H2>
        <P>
          Postinstall symlinks all bash scripts into <Code>~/.local/bin/</Code>{" "}
          so they&apos;re on your <Code>$PATH</Code>. On Windows, the
          <Code>.ps1</Code> variants live at{" "}
          <Code>~/.local/bin/</Code> too (resolved by the postinstall
          shim).
        </P>

        <H2>The 9 scripts</H2>
        <div className="space-y-5">
          {scripts.map((s) => (
            <div
              key={s.name}
              className="rounded-2xl border border-slate-border bg-slate-surface/40 p-5"
            >
              <div className="font-mono text-vibrant-green text-lg font-bold mb-1">
                {s.name}
              </div>
              <code className="block text-text-muted/80 font-mono text-xs mb-3 break-words">
                {s.args}
              </code>
              <P>
                <span dangerouslySetInnerHTML={{ __html: s.what }} />
              </P>
              <div className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-sm">
                <Strong>Fails on:</Strong>
                <span className="text-text-muted">{s.fails}</span>
                <Strong>Exit codes:</Strong>
                <code className="text-text-muted font-mono text-xs">{s.exits}</code>
              </div>
            </div>
          ))}
        </div>

        <H2>Conventions</H2>
        <Ul>
          <Li>Every script reads <Code>epic-config.yaml</Code> if present and respects its overrides (test_cmd, max_features, token_budget, etc.).</Li>
          <Li>Every script writes its runlog line to <Code>.pi/epics/&lt;id&gt;/runlog.md</Code> for the auditor.</Li>
          <Li><Strong>PowerShell mirrors are bit-equivalent</Strong> per convention C-003. Any new bash script <Em>must</Em> ship a <Code>.ps1</Code> alongside.</Li>
          <Li>UTF-8 is enforced via <Code>$env:PYTHONIOENCODING = &quot;utf-8&quot;</Code> in PowerShell scripts (L-046 lesson; fixed Windows console mojibake).</Li>
        </Ul>

        <H3>Scripting an epic from a terminal</H3>
        <P>You don&apos;t need pi to drive an epic. Direct CLI flow:</P>
        <Pre>{`pi-epic-init 0001-http-api --from designs/http-api.md
# (manually edit/commit .pi/epics/0001-http-api/decomposition.yaml)
pi-epic-validate-decomposition

# loop:
while ID=$(pi-epic-next-feature) && [ "$ID" != "DONE" ]; do
  case "$ID" in
    HALT:*) echo "halt: \${ID#HALT:}"; break ;;
  esac
  pi-feature-start "$ID"
  # implement in ../<repo>-$ID/ (with or without pi)
  (cd "../$(basename "$PWD")-$ID" && pytest -q)
  pi-feature-complete "$ID"
done

pi-epic-complete`}</Pre>

        <Callout kind="info" title="Why the scripts are separate from the slash commands">
          The slash commands wrap these scripts with planning, brain-aware
          guardrails, and sub-agent delegation. The scripts themselves are
          the <Em>mechanical</Em> primitives &mdash; they don&apos;t know
          about the brain, never call agents, and never write to{" "}
          <Code>.pi/project/</Code>. That separation means you can drop
          pi-epicflow into a CI pipeline or a script that doesn&apos;t run
          pi at all, and the mechanical workflow still holds.
        </Callout>

        <H2>Related</H2>
        <Ul>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/halts">Halt codes</a> &mdash; what `pi-epic-next-feature` returns and how to recover.</Li>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/config">Install &amp; config</a> &mdash; `epic-config.yaml` fields these scripts read.</Li>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/commands">Slash commands</a> &mdash; the pi-aware wrappers that drive these scripts.</Li>
        </Ul>

        <DocFooter />
      </Prose>
    </article>
  );
}
