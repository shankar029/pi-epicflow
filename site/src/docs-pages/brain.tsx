/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Brain } from "lucide-react";
import { Prose, H2, H3, P, Strong, Em, Code, Ul, Li, Pre, Callout } from "../blog-posts/_typography";
import { DocHeader, DocFooter } from "./_shared";

type Artifact = {
  file: string;
  idPrefix: string;
  purpose: string;
  appendOnly: boolean;
  cap: string;
  loadedBy: string;
};

const artifacts: Artifact[] = [
  {
    file: "index.md",
    idPrefix: "(no IDs &mdash; routing table)",
    purpose: "Routing table. &ldquo;Read for X&rdquo; rows tell the agent which artifacts to load for a given task. Always loaded first.",
    appendOnly: false,
    cap: "n/a (small file)",
    loadedBy: "Every session, before anything else.",
  },
  {
    file: "charter.md",
    idPrefix: "(no IDs &mdash; one-shot)",
    purpose: "Project goal, non-goals, quality bar, owner. Rarely changes; changes are append entries with `supersedes: <field>`.",
    appendOnly: false,
    cap: "no cap (one document)",
    loadedBy: "Every non-trivial session (routing rule).",
  },
  {
    file: "conventions.md",
    idPrefix: "C-NNN",
    purpose: "&ldquo;Always do X&rdquo; / &ldquo;never do Y&rdquo; rules. C-001 is the hard-coded anti-stub rule. C-NNN entries are appended; supersedes via new entry pointing at old.",
    appendOnly: true,
    cap: "no cap (active rules only; superseded pruned at rollover)",
    loadedBy: "Every non-trivial session (routing rule). Every worker/reviewer subagent.",
  },
  {
    file: "decisions.md",
    idPrefix: "DEC-NNN",
    purpose: "Technical choices. Context, decision, alternatives considered, consequences. The reason a project chose X over Y &mdash; future you and future agents grep this constantly.",
    appendOnly: true,
    cap: "500 entries · entries >2 years → `decisions-archive-YYYY.md`",
    loadedBy: "On-demand (routing rule). Always loaded by /epic-design.",
  },
  {
    file: "backlog.md",
    idPrefix: "BL-NNN",
    purpose: "Deferred work. &ldquo;Out of scope&rdquo; / &ldquo;for v2&rdquo; / &ldquo;parking lot&rdquo;. Cross-session ref count makes items ripe for promotion to an epic.",
    appendOnly: true,
    cap: "200 entries · open entries >180 days → `backlog-archive-YYYY.md`",
    loadedBy: "On-demand. Audited by /project-review.",
  },
  {
    file: "sessions.md",
    idPrefix: "S-NNN",
    purpose: "One entry per pi session. Stated goal, status (in-progress / achieved / paused / abandoned), files touched, ids promoted. The one file with a mutable line (`Status:` flips at close).",
    appendOnly: true,
    cap: "150 entries · closed entries >1 year → `sessions-archive-YYYY.md`",
    loadedBy: "Last 3 entries loaded at every session start.",
  },
  {
    file: "gotchas.md",
    idPrefix: "G-NNN",
    purpose: "Resolved footguns, version-specific quirks, surprising library behavior. Symptom / root cause / fix / still-applies-if.",
    appendOnly: true,
    cap: "200 entries · entries >2 years → `gotchas-archive-YYYY.md`",
    loadedBy: "On-demand. Grep before debugging anything.",
  },
  {
    file: "questions.md",
    idPrefix: "Q-NNN",
    purpose: "Open questions that don&apos;t have a decision yet. Status flips to `resolved (see DEC-NNN)` when answered &mdash; the one allowed non-append edit besides session close.",
    appendOnly: true,
    cap: "50 open + 200 resolved · open >1 year → `questions-archive-YYYY.md`",
    loadedBy: "On-demand. Surfaced by /project-review.",
  },
  {
    file: "modules/<name>.md",
    idPrefix: "(no IDs &mdash; one card per module)",
    purpose: "Per-module reference card: purpose, entry points, gotchas, owner. Optional &mdash; only worth writing when a module gets referenced ≥3 times across sessions.",
    appendOnly: false,
    cap: "no cap (one file per module)",
    loadedBy: "On-demand (routing rule). Worker/scout prime when working in that module.",
  },
];

export default function BrainPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <DocHeader
        eyebrow="Reference"
        Icon={Brain}
        title="Brain artifacts"
        subtitle={
          <>
            The 9 files in <Code>.pi/project/</Code> (per-repo brain), plus
            the cross-repo overlay at <Code>~/.pi/global-memory/</Code>.
            All plain Markdown &mdash; you can <Code>git diff</Code> the
            brain&apos;s entire history.
          </>
        }
      />
      <Prose>
        <H2>The 9 per-repo files</H2>

        <div className="space-y-4">
          {artifacts.map((a) => (
            <div
              key={a.file}
              className="rounded-2xl border border-slate-border bg-slate-surface/40 p-5"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                <code className="text-vibrant-green font-mono text-lg font-bold">
                  {a.file}
                </code>
                <code className="text-amber-300/80 font-mono text-xs">
                  ids: <span dangerouslySetInnerHTML={{ __html: a.idPrefix }} />
                </code>
                {a.appendOnly && (
                  <span className="text-xs font-mono uppercase tracking-wider text-text-muted/70 ml-auto">
                    append-only
                  </span>
                )}
              </div>
              <P>
                <span dangerouslySetInnerHTML={{ __html: a.purpose }} />
              </P>
              <div className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-sm">
                <Strong>Cap:</Strong>
                <span className="text-text-muted">{a.cap}</span>
                <Strong>Loaded by:</Strong>
                <span className="text-text-muted">{a.loadedBy}</span>
              </div>
            </div>
          ))}
        </div>

        <H2>The global overlay</H2>
        <P>
          At <Code>~/.pi/global-memory/</Code>. Three files, all optional,
          all opt-in via <Code>/project-init-global</Code>.
        </P>

        <div className="overflow-x-auto mb-6 rounded-2xl border border-slate-border">
          <table className="w-full text-sm">
            <thead className="bg-slate-surface/60">
              <tr className="text-left">
                <th className="p-3 font-semibold text-white">File</th>
                <th className="p-3 font-semibold text-white">IDs</th>
                <th className="p-3 font-semibold text-white">Purpose</th>
              </tr>
            </thead>
            <tbody className="text-text-muted">
              <tr className="border-t border-slate-border">
                <td className="p-3 font-mono">index.md</td>
                <td className="p-3 text-text-muted/70">&mdash;</td>
                <td className="p-3">Routing table for the overlay. Loaded eagerly at every session start (if file exists).</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3 font-mono">charter.md</td>
                <td className="p-3 text-text-muted/70">&mdash;</td>
                <td className="p-3">Optional. Owner identity + cross-repo &ldquo;about me&rdquo;. Skipped by default at init.</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3 font-mono">conventions.md</td>
                <td className="p-3 font-mono">GC-NNN</td>
                <td className="p-3">Cross-repo always/never rules. Per-repo C-NNN <Strong>wins on conflict</Strong>.</td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3 font-mono">decisions.md</td>
                <td className="p-3 font-mono">GD-NNN</td>
                <td className="p-3">Personal defaults &mdash; &ldquo;I always go with X for new projects&rdquo;. Per-repo DEC-NNN <Strong>wins on conflict</Strong>.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Callout kind="info" title="No global backlog, sessions, gotchas, or questions">
          By design (DEC-006). Those four are inherently per-project &mdash;
          a parked feature for repo A doesn&apos;t belong to repo B; a
          session goal is repo-scoped by definition. The overlay only
          covers genuinely cross-cutting concerns (rules and defaults).
        </Callout>

        <H2>Append-only with supersedes</H2>
        <P>
          DEC, BL, C, G, Q, GC, GD entries are <Strong>append-only</Strong>.
          Corrections never edit history &mdash; you append a new entry
          with a <Code>supersedes: DEC-021</Code> field, and the old entry
          gets marked <Code>**Status:** superseded by DEC-074</Code> (the
          one edit allowed to the old entry).
        </P>
        <P>
          The reason: the history of how you changed your mind is as
          valuable as the current state. Six months later you&apos;ll want
          to know &ldquo;wait, didn&apos;t we already try X?&rdquo; and the
          append-only log answers that without you needing to remember.
        </P>

        <H3>The two narrow non-append exceptions</H3>
        <Ul>
          <Li><Strong>Session close.</Strong> An <Code>in-progress</Code> entry&apos;s <Code>Status:</Code> and <Code>Ended at:</Code> lines are edited in place when the session closes (they were placeholders, not history). Closing fields are appended below.</Li>
          <Li><Strong>Q → DEC resolution.</Strong> When a <Code>Q-NNN</Code> is resolved, the new <Code>DEC-NNN</Code> is appended <Em>and</Em> the <Code>Q-NNN</Code>&apos;s status line flips from <Code>open</Code> to <Code>resolved (see DEC-NNN)</Code>, on the same turn.</Li>
        </Ul>

        <H2>Capacity caps &amp; rollover</H2>
        <P>
          Caps are soft &mdash; <Code>/project-review</Code>&apos;s A-8
          audit flags exceedances. Rollover is <Strong>always manual</Strong>:
          the agent prints the recipe, you confirm.
        </P>
        <Pre>{`# Rollover recipe (for decisions.md as example):
git mv decisions.md decisions-archive-2026-h1.md

# Create fresh decisions.md with live header + entries after cutoff:
cat > decisions.md <<EOF
# decisions

[header...]

[entries from DEC-433 onward]
EOF

# Add archive row to index.md
# Commit:
git commit -m "chore: rollover decisions.md → archive-2026-h1"`}</Pre>
        <P>
          <Strong>Stable IDs never recycle.</Strong> Cross-references
          like <Code>S-014 → DEC-021</Code> stay valid forever &mdash;
          when an ID isn&apos;t in the live file, the routing table tells
          future sessions to grep the archive.
        </P>

        <H2>Where templates come from</H2>
        <P>
          <Code>/project-init</Code> copies from <Code>templates/project/</Code>{" "}
          (per-repo) and <Code>/project-init-global</Code> from{" "}
          <Code>templates/global/</Code> (overlay). Both are idempotent
          &mdash; re-running skips files that already exist.
        </P>

        <H2>Related</H2>
        <Ul>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/triggers">Trigger phrases</a> &mdash; what produces each ID type.</Li>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/commands">Slash commands</a> &mdash; /project-init, /project-review, /session-end.</Li>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/skills">Skills</a> &mdash; project-memory is what reads &amp; writes these files.</Li>
        </Ul>

        <DocFooter />
      </Prose>
    </article>
  );
}
