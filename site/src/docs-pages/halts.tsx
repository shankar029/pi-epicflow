/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertTriangle } from "lucide-react";
import { Prose, H2, H3, P, Strong, Em, Code, Ul, Li, Pre, Callout } from "../blog-posts/_typography";
import { DocHeader, DocFooter } from "./_shared";

type Halt = {
  code: string;
  trigger: string;
  meaning: string;
  recovery: string;
  example: string;
};

const halts: Halt[] = [
  {
    code: "H1",
    trigger: "Tests still failing after ≥3 attempts with different strategies",
    meaning: "Worker tried 3+ approaches to make the test suite pass and ran out of viable angles. Either the test itself is wrong (worker can&apos;t tell) or the spec has a gap.",
    recovery: "Human inspects, fixes (or clarifies the spec), runs `/epic-run-auto` &mdash; resumes from this feature.",
    example: "F03 storage tests fail intermittently. Worker tried mock timing, threading.Event, asyncio.sleep, all flaky. Halts. You spot the test relies on filesystem ordering &mdash; fix the test, re-run.",
  },
  {
    code: "H2",
    trigger: "Blocking question with no reasonable default",
    meaning: "Mid-feature, the worker hit a decision that materially affects the implementation and has no obvious sensible default to pick. Could be: API shape ambiguity, choice between two equally-valid libs, design.md silent on a key behavior.",
    recovery: "Human answers in `halt.md`, runs `/epic-run-auto` &mdash; the worker re-spawns with the answer in context.",
    example: "F05 needs to decide JWT vs session cookies for auth. design.md §4 didn&apos;t specify. Halts asking. You write &ldquo;JWT, RS256&rdquo; in halt.md, resume.",
  },
  {
    code: "H3",
    trigger: "Token budget exceeded (per epic, see epic-config.yaml)",
    meaning: "Cumulative tokens across this epic&apos;s subagents passed the configured budget (default ~2M). Failsafe against runaway loops or pathologically large epics.",
    recovery: "Human inspects whether the budget is genuinely too low (raise `token_budget` in `epic-config.yaml`) or whether the epic is too big and should be split.",
    example: "Epic spent 1.8M tokens on F01-F08, F09 would push past 2M. Halts. You realize F09-F12 are really their own epic; split via `pi-epic-init 0002-foo` and finish 0001 with what&apos;s done.",
  },
  {
    code: "H4",
    trigger: "Wall-clock budget exceeded for a feature (default 8h)",
    meaning: "Feature has been &ldquo;in progress&rdquo; for >8h of wall-clock time. Worker is likely stuck in an unproductive loop or the feature was mis-sized in decomposition.",
    recovery: "Human inspects the feature&apos;s `worker-report.md`. If genuinely stuck, kill the worker and re-spawn with refined plan. If too big, split into multiple features via `pi-epic-extend` or re-decompose.",
    example: "F07 has been running 9h. You read worker-report.md, see it&apos;s been re-trying the same SDK init pattern. You note the SDK doc you missed, edit feature.md, kill the worker, resume.",
  },
  {
    code: "H5",
    trigger: "Destructive operation contradicting design intent",
    meaning: "Worker proposed (or attempted) something the orchestrator classifies as destructive &amp; off-design: force-push, drop unrelated database, mass-delete files outside scope, history rewrite. Hard safety stop.",
    recovery: "Never bypass without explicit human approval. Read the halt report, decide whether the destructive op was actually correct (rare) or a worker mistake (usual case). If correct, do it by hand and resume; if wrong, fix the worker&apos;s context and resume.",
    example: "F11 plan included &ldquo;drop the legacy_notes table&rdquo;. design.md only said &ldquo;deprecate&rdquo;. Halts. You confirm deprecate-not-drop, fix feature.md, resume.",
  },
  {
    code: "H6",
    trigger: "Merge conflict needing semantic judgment (not mechanical)",
    meaning: "`pi-feature-complete` tried to squash-merge the feature branch into epic, hit a conflict that&apos;s not auto-resolvable by `ours`/`theirs`/recursive. Two features touched overlapping logic in incompatible ways.",
    recovery: "Human resolves on epic branch by hand, commits, re-runs `/epic-run-auto`. The orchestrator picks up from the next-ready feature.",
    example: "F04 and F06 both refactored `api.py`&apos;s error handler. F06 merged first; F04&apos;s merge conflicts. You resolve, choosing F06&apos;s shape with F04&apos;s additions.",
  },
  {
    code: "H7",
    trigger: "DAG corruption (no resolvable next feature, cycle, missing dep)",
    meaning: "`pi-epic-next-feature` can&apos;t find a runnable feature. Could be: cycle in `depends_on`, all remaining features blocked on a halted feature, decomposition.yaml hand-edited into an invalid state.",
    recovery: "Human edits `decomposition.yaml` to fix the dep graph, runs `pi-epic-validate-decomposition` to confirm, resumes.",
    example: "You hand-edited decomposition.yaml to add F12 depending on F11, but F11 was removed. Halts. You fix F12&apos;s deps, validate, resume.",
  },
];

export default function HaltsPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <DocHeader
        eyebrow="Reference"
        Icon={AlertTriangle}
        title="Halt codes (H1–H7)"
        subtitle={
          <>
            When the orchestrator stops cleanly instead of guessing.
            Every halt writes a report to{" "}
            <Code>.pi/epics/&lt;id&gt;/halt.md</Code> and exits the auto
            loop. Resume after fixing the underlying cause &mdash; the
            loop picks up from where it stopped.
          </>
        }
      />
      <Prose>
        <H2>The philosophy: halt, don&apos;t retry-with-different-prompt</H2>
        <P>
          Coding agents fail in two distinct ways:{" "}
          <Strong>guessable failures</Strong> (transient network errors,
          flaky tests) and <Strong>specification failures</Strong> (the
          design didn&apos;t say what to do here). Retry-with-prompt-tweak
          fixes the first and silently papers over the second.
          Halt-and-report forces the second class into your awareness,
          where it can be fixed properly in the design or plan.
        </P>
        <P>
          After ~30 epics, the &ldquo;specification gap&rdquo; halt mode
          has produced more lessons than every other failure mode
          combined.
        </P>

        <H2>The 7 codes</H2>

        <div className="space-y-5">
          {halts.map((h) => (
            <div
              key={h.code}
              className="rounded-2xl border border-amber-300/30 bg-amber-300/5 p-5"
            >
              <div className="flex flex-wrap items-baseline gap-3 mb-2">
                <code className="text-amber-300 font-mono text-2xl font-black">
                  {h.code}
                </code>
                <Strong>{h.trigger}</Strong>
              </div>
              <P>
                <span dangerouslySetInnerHTML={{ __html: h.meaning }} />
              </P>
              <div className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-sm mb-3">
                <Strong>Recovery:</Strong>
                <span className="text-text-muted">
                  <span dangerouslySetInnerHTML={{ __html: h.recovery }} />
                </span>
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer text-amber-300 hover:underline">
                  Example
                </summary>
                <P>
                  <Em>
                    <span dangerouslySetInnerHTML={{ __html: h.example }} />
                  </Em>
                </P>
              </details>
            </div>
          ))}
        </div>

        <H2>The halt report</H2>
        <P>
          Every halt writes <Code>.pi/epics/&lt;id&gt;/halt.md</Code> with
          a consistent structure:
        </P>
        <Pre>{`# Halt report

**Code:** H2
**Feature:** F05-auth-jwt
**Timestamp:** 2026-05-26T14:32:11Z

## What happened

[1-paragraph human-readable summary of why the worker halted]

## What the worker tried

[Bulleted list of attempts before halting, with brief outcomes]

## What you need to decide

[The specific question, with 2-3 candidate answers and recommendation]

## To resume

After answering above:
  cd /path/to/repo
  pi
  /epic-run-auto
`}</Pre>

        <H2>Resume mechanics</H2>
        <P>
          <Code>/epic-run-auto</Code> is always resumable. It reads
          <Code>STATE.md</Code>, sees the halt, asks you to confirm the
          halt is resolved, then continues from the next-ready feature.
          Already-merged features stay merged. Halted feature gets a
          fresh worker spawn with the updated context.
        </P>

        <Callout kind="info" title="Forcing through a halt is anti-pattern">
          If you find yourself bypassing halts with{" "}
          <Code>--skip-tests</Code> or hand-merging without addressing
          the underlying cause: stop. The halt is the workflow telling
          you the spec needs work. Force-through is the single fastest
          way to make pi-epicflow useless &mdash; you lose the lessons
          you would have gotten from properly addressing the spec gap.
        </Callout>

        <H3>The optional H11 (E2E gate)</H3>
        <P>
          When <Code>pi-epic-complete</Code> runs with an opt-in E2E gate
          configured (<Code>e2e_cmd</Code> in <Code>epic-config.yaml</Code>),
          a failure exits with code 13 / halt &ldquo;H11&rdquo; in
          newer terminology. Recovery: bisect commits on the epic branch
          to find the offending merge, fix in a follow-up commit on the
          epic branch, re-run <Code>pi-epic-complete</Code>.
        </P>

        <H2>Related</H2>
        <Ul>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/scripts">CLI scripts</a> &mdash; `pi-epic-next-feature` returns HALT:&lt;code&gt;.</Li>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/config">Install &amp; config</a> &mdash; `token_budget`, `wall_clock_budget`, `e2e_cmd` in epic-config.yaml.</Li>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/commands">Slash commands</a> &mdash; /epic-run-auto resumes from a halt.</Li>
        </Ul>

        <DocFooter />
      </Prose>
    </article>
  );
}
