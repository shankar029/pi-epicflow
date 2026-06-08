/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GitBranch } from "lucide-react";
import { Prose, H2, H3, P, Strong, Em, Code, Ul, Li, Pre, Callout } from "../blog-posts/_typography";
import { DocHeader, DocFooter } from "./_shared";

export default function WorktreesPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <DocHeader
        eyebrow="Internals"
        Icon={GitBranch}
        title="Worktree topology"
        subtitle={
          <>
            Where each branch actually lives on disk while you&apos;re
            running an epic. Three possible layers &mdash; main, epic,
            per-feature &mdash; and which scripts create which.
          </>
        }
      />
      <Prose>
        <H2>Quick answer</H2>
        <Callout kind="info" title="Who creates worktrees">
          <Ul>
            <Li><Code>pi-epic-init</Code> creates a <Strong>branch only</Strong>{" "}
              (<Code>epic/&lt;slug&gt;</Code>). <Em>It does not create a worktree.</Em></Li>
            <Li><Code>pi-feature-start</Code> creates a <Strong>branch and a worktree</Strong>{" "}
              per feature (<Code>feat/&lt;epic&gt;/&lt;fid&gt;-&lt;slug&gt;</Code> at{" "}
              <Code>../&lt;repo&gt;-&lt;fid&gt;-&lt;slug&gt;/</Code>).</Li>
            <Li>The <Strong>epic-level worktree is opt-in</Strong>: you create
              it yourself with <Code>git worktree add</Code> <Em>before</Em>{" "}
              calling <Code>pi-epic-init</Code>, and <Code>pi-epic-init</Code> will
              detect and reuse it.</Li>
          </Ul>
        </Callout>

        <H2>The two patterns</H2>

        <H3>Pattern A &mdash; Default (epic in primary checkout)</H3>
        <P>
          The simplest and most common setup. You run{" "}
          <Code>pi-epic-init</Code> in your normal repo checkout. It creates
          the <Code>epic/&lt;slug&gt;</Code> branch and switches your current
          checkout to it. Per-feature work happens in sibling worktrees that
          <Code>pi-feature-start</Code> spawns.
        </P>

        <Pre>{`Before /epic-design:
  ~/code/notesd/                  ← on main

After pi-epic-init http-api:
  ~/code/notesd/                  ← on epic/http-api (same dir!)

During /epic-run-auto (when F02 is in flight):
  ~/code/notesd/                  ← on epic/http-api (orchestrator + state)
  ~/code/notesd-F02-post/         ← feat/http-api/F02-post (worker subagent)

When F02 merges:
  ~/code/notesd/                  ← still on epic/http-api
  (notesd-F02-post/ worktree is pruned)

After pi-epic-complete:
  ~/code/notesd/                  ← back on main, single PR open on epic/http-api`}</Pre>

        <P>
          <Strong>Cost:</Strong> While the epic is running, your primary
          checkout is &ldquo;stuck&rdquo; on the epic branch &mdash; switching
          to <Code>main</Code> mid-epic to hot-fix something requires
          juggling. For solo dev work on one thing at a time, this is fine
          and frictionless.
        </P>

        <H3>Pattern B &mdash; Dedicated epic worktree (opt-in)</H3>
        <P>
          If you need <Code>main</Code> to stay available (prod hot-fixes,
          parallel small PRs, juggling multiple epics), create a separate
          worktree for the epic <Em>before</Em> initializing it. The script
          detects this layout and cooperates.
        </P>

        <Pre>{`# From your main checkout (on main):
cd ~/code/notesd
git worktree add ../notesd-epic-http-api -b epic/http-api main

# Now switch into the dedicated epic worktree:
cd ../notesd-epic-http-api

# Initialize the epic there. pi-epic-init detects you're already on
# epic/http-api and reuses the branch instead of trying to create it.
pi-epic-init http-api --from design.md`}</Pre>

        <Pre>{`Resulting layout during /epic-run-auto (F02 in flight):
  ~/code/notesd/                          ← on main (free to hot-fix)
  ~/code/notesd-epic-http-api/            ← on epic/http-api (orchestrator)
  ~/code/notesd-epic-http-api-F02-post/   ← feat/http-api/F02-post (worker)`}</Pre>

        <P>
          <Strong>Cost:</Strong> One extra directory; slightly more setup;
          you must <Code>cd</Code> into the epic worktree before running
          <Code>pi</Code> and the slash commands.
        </P>

        <H2>When to pick which</H2>

        <div className="overflow-x-auto mb-6 rounded-2xl border border-slate-border">
          <table className="w-full text-sm">
            <thead className="bg-slate-surface/60">
              <tr className="text-left">
                <th className="p-3 font-semibold text-white">Use case</th>
                <th className="p-3 font-semibold text-white">Pattern</th>
              </tr>
            </thead>
            <tbody className="text-text-muted">
              <tr className="border-t border-slate-border">
                <td className="p-3">Solo dev, one epic at a time, no hot-fix pressure</td>
                <td className="p-3"><Strong>A (default)</Strong></td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3">Production repo, may need main-branch hot-fixes</td>
                <td className="p-3"><Strong>B (dedicated)</Strong></td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3">Multiple epics in flight on the same repo</td>
                <td className="p-3"><Strong>B</Strong> &mdash; one worktree per epic</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3">Long-running epic (days/weeks) where reviewers will land small PRs in parallel</td>
                <td className="p-3"><Strong>B</Strong></td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3">Quick experiment, &lt; 5 features, throwaway repo</td>
                <td className="p-3"><Strong>A</Strong></td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3">Bare-repo + worktrees layout (already your setup)</td>
                <td className="p-3"><Strong>B</Strong> &mdash; matches your existing workflow</td>
              </tr>
            </tbody>
          </table>
        </div>

        <H2>Per-feature worktrees (always automatic)</H2>
        <P>
          Regardless of which top-level pattern you pick, every feature
          gets its own worktree at <Code>../&lt;repo&gt;-&lt;fid&gt;-&lt;slug&gt;/</Code>.
          That&apos;s how the orchestrator parallelizes worker subagents
          safely &mdash; each worker edits an isolated checkout, no two
          workers ever fight over the index.
        </P>

        <Pre>{`# Created by pi-feature-start (called from /epic-run-auto):
$ git worktree list
~/code/notesd                          d24f1a2 [epic/http-api]
~/code/notesd-F02-post                 9b81f3c [feat/http-api/F02-post]
~/code/notesd-F03-storage              afd11ee [feat/http-api/F03-storage]
~/code/notesd-F04-auth                 c0aae31 [feat/http-api/F04-auth]`}</Pre>

        <P>
          When <Code>pi-feature-complete</Code> squash-merges the feature
          back into the epic branch, it also prunes the per-feature
          worktree (<Code>git worktree remove</Code>). You should never
          need to clean these up manually.
        </P>

        <Callout kind="warn" title="Don't cd into a feature worktree by hand">
          The orchestrator owns those checkouts. If you start editing
          inside one, the worker subagent may overwrite your changes when
          it next runs, and you&apos;ll trigger an H6 (merge conflict
          needing semantic judgment) at squash-merge time. If you need to
          inspect what a worker did, view the worktree&apos;s diff via{" "}
          <Code>git -C ../&lt;repo&gt;-F02-post diff epic/http-api...</Code>{" "}
          &mdash; read-only.
        </Callout>

        <H2>Why this design</H2>
        <Ul>
          <Li>
            <Strong>Worker isolation.</Strong> Two parallel workers can&apos;t
            corrupt each other&apos;s state &mdash; they edit different
            checkouts and merge through git, not through a shared index.
          </Li>
          <Li>
            <Strong>Resumability.</Strong> If <Code>/epic-run-auto</Code>{" "}
            crashes mid-feature, the per-feature worktree still exists with
            the worker&apos;s last state. You can inspect, fix, and resume
            instead of starting over.
          </Li>
          <Li>
            <Strong>Halt safety.</Strong> When an H1&ndash;H7 halt fires,
            the offending worktree is preserved so you can inspect what the
            worker tried (<Code>worker-report.md</Code>, the actual diff,
            the failing tests).
          </Li>
          <Li>
            <Strong>Branch-per-feature, not branch-only.</Strong>{" "}
            Conceptually you could do this with branch-switching in a
            single checkout, but every switch invalidates editor state,
            test caches, and dev-server processes. Worktrees keep each
            feature&apos;s environment warm.
          </Li>
        </Ul>

        <H2>Cleanup if things go sideways</H2>
        <P>
          If a feature worktree was orphaned (manual interrupt, crash, etc.):
        </P>
        <Pre>{`# List all worktrees to find stragglers:
git worktree list

# Remove a specific worktree (safe — checks for uncommitted work):
git worktree remove ../notesd-F02-post

# Force-remove (if you've already saved what you need):
git worktree remove --force ../notesd-F02-post

# Prune metadata for worktrees whose dirs were deleted by hand:
git worktree prune`}</Pre>

        <P>
          The <Code>pi-epicflow-doctor</Code> command flags orphaned
          per-feature worktrees and prints these recipes inline.
        </P>

        <H2>Related</H2>
        <Ul>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/scripts">CLI scripts</a> &mdash; <Code>pi-epic-init</Code>, <Code>pi-feature-start</Code>, <Code>pi-feature-complete</Code> details.</Li>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/halts">Halt codes</a> &mdash; H6 (merge conflict) is the worktree-related failure mode.</Li>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/config">Install &amp; config</a> &mdash; <Code>max_parallel_workers</Code> caps how many feature worktrees can exist concurrently.</Li>
        </Ul>

        <DocFooter />
      </Prose>
    </article>
  );
}
