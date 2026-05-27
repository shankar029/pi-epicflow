/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sparkles } from "lucide-react";
import { Prose, H2, H3, P, Strong, Em, Code, Ul, Li, Pre, Callout } from "../blog-posts/_typography";
import { DocHeader, DocFooter } from "./_shared";

type Trigger = {
  phrases: string[];
  cooccur: string;
  destination: string;
  idPrefix: string;
  action: string;
};

const triggers: Trigger[] = [
  {
    phrases: ['"let&apos;s not do X now"', '"out of scope"', '"for later"', '"future"', '"park it"', '"defer"', '"skip for now"', '"v2"', '"won&apos;t ship this round"'],
    cooccur: "A work-item noun (this feature / that refactor / the X module / etc.)",
    destination: "backlog.md",
    idPrefix: "BL-NNN",
    action: "Append entry with source-session id.",
  },
  {
    phrases: ['"let&apos;s go with X over Y"', '"decided"', '"we&apos;ll use X"', "explicit choice between alternatives"],
    cooccur: "A technical noun (lib / approach / schema / pattern)",
    destination: "decisions.md",
    idPrefix: "DEC-NNN",
    action: "Append entry with context / decision / alternatives / consequences.",
  },
  {
    phrases: ['"always do X"', '"never do Y"', '"from now on"', '"the rule is"', '"convention is"'],
    cooccur: "A coding pattern or repo norm",
    destination: "conventions.md",
    idPrefix: "C-NNN",
    action: "Append (or amend with `supersedes:` pointer).",
  },
  {
    phrases: ["Resolved a tricky bug", "footgun", "surprising library behavior", "version-specific quirk"],
    cooccur: "(none required &mdash; the resolution itself is the trigger)",
    destination: "gotchas.md",
    idPrefix: "G-NNN",
    action: "Append entry: symptom / root cause / fix / still-applies-if.",
  },
  {
    phrases: ['"we don&apos;t know yet"', '"we&apos;re still deciding"', '"open question"', '"need to figure out"', '"depends on X first"'],
    cooccur: "A technical noun, AND no immediate decision in the same message",
    destination: "questions.md",
    idPrefix: "Q-NNN",
    action: "Append entry: context / alternatives / resolves-when / owner.",
  },
  {
    phrases: ["Resolved an open question previously logged as Q-NNN"],
    cooccur: "(none &mdash; resolution detected by referencing the Q-NNN)",
    destination: "decisions.md + questions.md",
    idPrefix: "DEC-NNN (resolves: Q-NNN)",
    action: "BOTH writes on the same turn: append DEC-NNN; flip Q-NNN status to `resolved (see DEC-NNN)`.",
  },
];

const globalTriggers: Trigger[] = [
  {
    phrases: ['"globally always X"', '"across all my repos"', '"in every &lt;lang&gt; project of mine"', '"as a personal rule"'],
    cooccur: "A coding pattern or norm",
    destination: "~/.pi/global-memory/conventions.md",
    idPrefix: "GC-NNN",
    action: "Append entry to the overlay.",
  },
  {
    phrases: ['"I always go with X for new projects"', '"my default is X"'],
    cooccur: "A technical choice (lib / framework / tool)",
    destination: "~/.pi/global-memory/decisions.md",
    idPrefix: "GD-NNN",
    action: "Append entry to the overlay.",
  },
];

export default function TriggersPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <DocHeader
        eyebrow="Reference"
        Icon={Sparkles}
        title="Trigger phrases"
        subtitle={
          <>
            The vocabulary that grows your brain without any slash
            commands. When you (or pi) use one of these phrases <Em>and</Em>{" "}
            a co-occurring noun fires, pi appends the right entry{" "}
            <Em>on that turn</Em> &mdash; not at end of session.
          </>
        }
      />
      <Prose>
        <H2>Why phrases instead of commands</H2>
        <P>
          Trigger writes survive crashes, lost context, and interruptions
          (the <Strong>ASSUME INTERRUPTION</Strong> principle). End-of-
          session summaries don&apos;t. These phrases are also the ones
          you&apos;d use anyway in normal conversation about a project
          &mdash; the friction is zero.
        </P>

        <H2>Per-repo triggers</H2>
        <P>Six trigger types. Each requires a phrase pattern <Strong>and</Strong> a co-occurring noun to fire.</P>

        <div className="space-y-4">
          {triggers.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-border bg-slate-surface/40 p-5"
            >
              <div className="flex flex-wrap items-baseline gap-3 mb-3">
                <code className="text-vibrant-green font-mono text-sm font-bold">
                  → {t.destination}
                </code>
                <code className="text-amber-300/80 font-mono text-xs">
                  {t.idPrefix}
                </code>
              </div>
              <div className="mb-3">
                <Strong>Phrases:</Strong>{" "}
                <span className="text-text-muted text-sm">
                  {t.phrases.map((p, j) => (
                    <span key={j}>
                      <code className="bg-slate-surface/60 px-1.5 py-0.5 rounded text-vibrant-green/90 font-mono text-xs" dangerouslySetInnerHTML={{ __html: p }} />
                      {j < t.phrases.length - 1 && <span className="text-text-muted/40"> · </span>}
                    </span>
                  ))}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-sm">
                <Strong>Co-occurs with:</Strong>
                <span className="text-text-muted">{t.cooccur}</span>
                <Strong>Action:</Strong>
                <span className="text-text-muted">{t.action}</span>
              </div>
            </div>
          ))}
        </div>

        <H2>Global-overlay triggers</H2>
        <P>
          Cross-repo phrasing is <Em>explicit</Em>. Bare &ldquo;always do
          X&rdquo; without cross-repo framing still fires the per-repo
          trigger. The overlay only writes when the phrasing makes the
          global scope clear.
        </P>

        <div className="space-y-4">
          {globalTriggers.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-border bg-amber-300/5 p-5"
            >
              <div className="flex flex-wrap items-baseline gap-3 mb-3">
                <code className="text-amber-300 font-mono text-sm font-bold">
                  → {t.destination}
                </code>
                <code className="text-amber-300/80 font-mono text-xs">
                  {t.idPrefix}
                </code>
              </div>
              <div className="mb-3">
                <Strong>Phrases:</Strong>{" "}
                <span className="text-text-muted text-sm">
                  {t.phrases.map((p, j) => (
                    <span key={j}>
                      <code className="bg-slate-surface/60 px-1.5 py-0.5 rounded text-amber-300/90 font-mono text-xs" dangerouslySetInnerHTML={{ __html: p }} />
                      {j < t.phrases.length - 1 && <span className="text-text-muted/40"> · </span>}
                    </span>
                  ))}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-sm">
                <Strong>Co-occurs with:</Strong>
                <span className="text-text-muted">{t.cooccur}</span>
                <Strong>Action:</Strong>
                <span className="text-text-muted">{t.action}</span>
              </div>
            </div>
          ))}
        </div>

        <H2>Anti-false-positives</H2>
        <P>
          Words like &ldquo;later&rdquo; / &ldquo;future&rdquo; appear
          constantly in innocuous contexts (&ldquo;I&apos;ll think about
          that later&rdquo;, &ldquo;in the future this might change&rdquo;).
          The trigger only fires when the phrase{" "}
          <Strong>co-occurs with a work-item or technical noun</Strong> in
          the same or adjacent sentence. If unsure, pi does not log &mdash;
          better a missed entry than a noisy backlog.
        </P>

        <Callout kind="info" title="Announcement noise rules">
          By default, pi logs entries <Em>silently</Em>. You don&apos;t see
          &ldquo;logged as DEC-12&rdquo; on every turn. Pi announces
          inline only when the entry materially changes the conversation
          direction. Otherwise the writes are summarized in the
          final-report footer:
          <Pre>{`Memory updates this turn:
  - DEC-007 (CSV export format)
  - Q-001 → resolved (see DEC-007)
  - G-002 (pytest tmp_path isolation gotcha)`}</Pre>
        </Callout>

        <H2>Examples of triggers firing</H2>
        <Pre>{`you ▸ let's go with append-only JSONL over SQLite for storage —
      O(1) writes, no corruption window
       └── trigger: "let's go with X over Y" + technical noun → DEC-NNN
       └── pi appends DEC-001 silently, continues with implementation

you ▸ from now on, every test that touches the filesystem must use tmp_path
       └── trigger: "from now on" + repo norm → C-NNN
       └── pi appends C-002, announces inline ("logged as C-002")
           because future code is bound by it

you ▸ we don't know yet whether to expose edit history or dedupe at read —
      depends on what the export command needs
       └── trigger: "we don't know yet" + technical noun + no decision → Q-NNN
       └── pi appends Q-001, mentions in final summary

you ▸ tripped on pytest's tmp_path resolving differently with pytest 8.0
       └── trigger: "tripped on" + version-specific quirk → G-NNN
       └── pi appends G-001 with symptom/cause/fix

you ▸ defer the TUI client to v2 — focus on getting the API solid first
       └── trigger: "defer" + work-item noun → BL-NNN
       └── pi appends BL-002

you ▸ globally always use ruff for python projects, never black
       └── trigger: "globally always" + "across all" framing → GC-NNN
       └── pi appends GC-001 to ~/.pi/global-memory/conventions.md`}</Pre>

        <H2>Related</H2>
        <Ul>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/brain">Brain artifacts</a> &mdash; the files each trigger writes to.</Li>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/skills">Skills</a> &mdash; project-memory is the skill that watches for these triggers.</Li>
          <Li><a className="text-vibrant-green hover:underline" href="#/blog/project-memory">Blog: project memory rationale</a> &mdash; why this design was picked over alternatives.</Li>
        </Ul>

        <DocFooter />
      </Prose>
    </article>
  );
}
