/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Settings } from "lucide-react";
import { Prose, H2, H3, P, Strong, Em, Code, Ul, Li, Pre, Callout } from "../blog-posts/_typography";
import { DocHeader, DocFooter } from "./_shared";

export default function ConfigPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <DocHeader
        eyebrow="Reference"
        Icon={Settings}
        title="Install &amp; configuration"
        subtitle={
          <>
            Where files land, what postinstall does, how to configure an
            epic via <Code>epic-config.yaml</Code>, and what environment
            variables matter.
          </>
        }
      />
      <Prose>
        <H2>Install</H2>
        <Pre>{`# Recommended (pinned):
pi install npm:pi-epicflow@^0.14

# Latest:
pi install npm:pi-epicflow

# From git (during development):
pi install git:github.com/shankar029/pi-epicflow`}</Pre>

        <H3>Requirements</H3>
        <Ul>
          <Li><Code>pi</Code> &ge; 0.74</Li>
          <Li><Code>git</Code> &ge; 2.5 (worktree support)</Li>
          <Li><Code>bash</Code> on Unix; <Code>pwsh</Code> 7+ on Windows</Li>
          <Li>Optional: <Code>gh</Code> CLI for PR creation (else prints the command for manual run)</Li>
        </Ul>

        <H2>What postinstall does</H2>
        <Ul>
          <Li>Registers <Code>epic-feature-workflow</Code> + <Code>project-memory</Code> skills in <Code>~/.pi/agent/settings.json</Code>.</Li>
          <Li>Copies all 11 personas from <Code>agents/*.md</Code> to <Code>~/.pi/agent/agents/</Code>.</Li>
          <Li>Symlinks all 9 CLI scripts into <Code>~/.local/bin/</Code> (bash on Unix; PowerShell mirrors via shim on Windows).</Li>
          <Li>Auto-discovers new prompts/agents via <Code>readdirSync</Code> + <Code>files</Code> glob &mdash; future personas/prompts register automatically on upgrade.</Li>
          <Li>Auto-installs <Code>pi-subagents</Code> (required for /epic-run-auto) and <Code>pi-intercom</Code> (optional, nicer prompts).</Li>
        </Ul>

        <H2>Layout after install</H2>
        <Pre>{`~/.pi/agent/
├── skills/
│   ├── project-memory/SKILL.md
│   └── epic-feature-workflow/
│       ├── SKILL.md
│       ├── scripts/         # bash CLI
│       ├── scripts-win/     # PowerShell mirrors
│       ├── lib/             # internal helpers
│       └── epic.tmpl/       # epic scaffold template
├── agents/
│   ├── epicflow-scout.md
│   ├── epicflow-researcher.md
│   ├── epicflow-worker.md
│   ├── epicflow-reviewer.md
│   ├── epicflow-oracle.md
│   ├── epicflow-steward.md
│   ├── feature-planner.md
│   ├── feature-worker.md
│   ├── feature-reviewer.md
│   ├── feature-epic-reviewer.md
│   └── epic-design-critic.md
└── prompts/
    ├── project-init.md
    ├── project-init-global.md
    ├── project-onboard.md
    ├── project-review.md
    ├── session-end.md
    ├── epic-design.md
    ├── epic-review-design.md
    ├── epic-decompose.md
    └── epic-run-auto.md

~/.local/bin/
├── pi-epic-init
├── pi-epic-extend
├── pi-epic-status
├── pi-epic-next-feature
├── pi-epic-validate-decomposition
├── pi-feature-start
├── pi-feature-complete
├── pi-epic-complete
└── pi-epicflow-doctor

~/.pi/global-memory/             # only if /project-init-global was run
├── index.md
├── conventions.md
├── decisions.md
└── (charter.md, optional)`}</Pre>

        <H2>Per-epic configuration</H2>
        <P>
          Every epic gets <Code>.pi/epics/&lt;id&gt;/epic-config.yaml</Code>{" "}
          scaffolded by <Code>pi-epic-init</Code>. Override defaults
          here per epic.
        </P>

        <Pre>{`# .pi/epics/0001-http-api/epic-config.yaml

# --- Tests ---
test_cmd: "python -m pytest -q"
# Autodetected from pyproject.toml/package.json if omitted.

# --- Budgets (halts) ---
token_budget: 2000000          # H3 fires when exceeded
wall_clock_budget_per_feature_hours: 8   # H4 fires per-feature

# --- Strictness ---
strict_deliverables: true      # default in v0.11+
                               # validator enforces decomposition.yaml
                               # trigger→deliverable contract

# --- Optional E2E gate (v0.10+) ---
e2e_cmd: ""                    # empty = no gate; non-empty = H11 if it fails
                               # at pi-epic-complete time

# --- Parallel features ---
max_parallel_workers: 4        # hard cap for /epic-run-auto

# --- Base branch ---
base_branch: ""                # empty = default branch (main/master)
                               # set explicitly to e.g. develop`}</Pre>

        <H3>Decomposition fields per feature</H3>
        <P>
          Inside <Code>decomposition.yaml</Code>, each feature can declare:
        </P>
        <Pre>{`features:
  - id: F02
    slug: post-note-endpoint
    title: "POST /note endpoint with validation"

    depends_on: [F01]
    scope_files:
      - src/notesd/api.py
      - tests/test_api_post.py

    needs_planner: false       # true → spawn feature-planner first
    parallel_eligible: true    # false → block peers from running concurrently

    # Strict-deliverables contract (v0.11+):
    e2e_scenarios:
      - "POST valid note → 201 with id+ts"
      - "POST oversized body → 413"
    mock_fixtures:
      - tests/fixtures/sample_notes.json
    docs_updates:
      - docs/api.md
    changelog_entry: true      # F02 must touch CHANGELOG.md

    acceptance_criteria:
      - "Endpoint registered at /note (POST only)"
      - "Body parsed as JSON, max 64 KB"
      - "Returns 201 + Location header on success"
      - "Persists via storage.append() (DEC-001)"`}</Pre>

        <H2>The global overlay</H2>
        <P>
          Created by <Code>/project-init-global</Code> at{" "}
          <Code>~/.pi/global-memory/</Code>. Optional per user. Loaded
          eagerly by every project-memory-aware session. Per-repo
          <Code>.pi/project/</Code> always wins on conflict.
        </P>
        <P>See <a className="text-vibrant-green hover:underline" href="#/docs/brain">Brain artifacts</a> for the overlay&apos;s file structure.</P>

        <H2>Environment variables</H2>
        <div className="overflow-x-auto mb-6 rounded-2xl border border-slate-border">
          <table className="w-full text-sm">
            <thead className="bg-slate-surface/60">
              <tr className="text-left">
                <th className="p-3 font-semibold text-white">Variable</th>
                <th className="p-3 font-semibold text-white">Purpose</th>
              </tr>
            </thead>
            <tbody className="text-text-muted">
              <tr className="border-t border-slate-border">
                <td className="p-3 font-mono"><Code>PI_EPICFLOW_BASE_BRANCH</Code></td>
                <td className="p-3">Override the auto-detected default branch (main/master) globally. Useful in repos using `develop` or `trunk`.</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3 font-mono"><Code>PYTHONIOENCODING=utf-8</Code></td>
                <td className="p-3">Set automatically by PowerShell mirrors (L-046). Required for non-ASCII output (DAG box characters, em-dashes).</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3 font-mono"><Code>GH_TOKEN</Code></td>
                <td className="p-3">If set and `gh` CLI present, `pi-epic-complete` creates the PR directly. Else prints the command.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <H2>Uninstall</H2>
        <Pre>{`pi uninstall pi-epicflow

# Manual cleanup (optional &mdash; uninstall doesn't touch these):
rm -rf ~/.pi/global-memory/            # global overlay
# Per-repo .pi/project/ stays; it's part of the repo, not the install.`}</Pre>

        <H2>Verify your install</H2>
        <Pre>{`pi-epicflow-doctor

# Sample output:
✓ pi-epicflow at ~/.pi/agent/skills/epic-feature-workflow/  (v0.14.1)
✓ Skills registered (project-memory + epic-feature-workflow)
✓ 11 personas in ~/.pi/agent/agents/
✓ 9 CLI scripts on PATH
✓ Active epic: 0001-http-api (3/5 features merged)
✓ Anti-stub grep clean on touched files
ⓘ Global overlay: not initialized (run /project-init-global if desired)`}</Pre>

        <Callout kind="info" title="Smoke tests">
          The repo ships <Code>install/smoke-test.sh</Code> (bash) and{" "}
          <Code>install/smoke-test.ps1</Code> (pwsh). They validate the
          entire install pipeline end-to-end against a temp directory.
          29/29 bash + 8/8 pwsh as of v0.14.1. Run before reporting a
          bug.
        </Callout>

        <H2>Related</H2>
        <Ul>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/scripts">CLI scripts</a> &mdash; what every installed script does.</Li>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/brain">Brain artifacts</a> &mdash; what files <Code>/project-init</Code> creates.</Li>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/halts">Halt codes</a> &mdash; budgets in <Code>epic-config.yaml</Code> trigger H3 and H4.</Li>
        </Ul>

        <DocFooter />
      </Prose>
    </article>
  );
}
