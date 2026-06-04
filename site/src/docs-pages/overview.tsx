/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Map, Compass, BookOpen, Github } from "lucide-react";
import { Prose, H2, H3, P, Strong, Em, Code, Ul, Li, Pre, Callout } from "../blog-posts/_typography";

const REPO = "https://github.com/shankar029/pi-epicflow";

export default function OverviewPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 bg-vibrant-green/10 text-vibrant-green text-xs font-bold font-mono px-3 py-1 rounded-full border border-vibrant-green/20 mb-4 uppercase tracking-widest">
          <Map className="w-3 h-3" /> Start here
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-3">
          Overview &amp; how to navigate
        </h1>
        <p className="text-text-muted text-lg leading-relaxed">
          Reference docs are organized by what you&apos;re holding when you
          come to them: a slash command, a CLI script, an agent, an
          artifact, a halt code, or a config knob. Pick the right entry
          point from below.
        </p>
      </header>

      <Prose>
        <Callout kind="info" title="Prerequisite — install pi first">
          pi-epicflow is a <Strong>plugin for pi</Strong>, an open-source
          terminal coding agent. It is not a standalone CLI &mdash; every
          slash command and persona in these docs runs <Em>inside</Em> a
          pi session. If you don&apos;t have pi yet, grab it at{" "}
          <a className="text-vibrant-green hover:underline" href="https://pi.dev">pi.dev</a>{" "}
          (one-line install on macOS / Linux / WSL / Windows), then
          install this extension:
          <Pre>{`pi install npm:pi-epicflow@^0.14`}</Pre>
          See <a className="text-vibrant-green hover:underline" href="#/docs/config">Install &amp; config</a>{" "}
          for the full setup (postinstall behavior, file layout, env vars).
        </Callout>

        <H2>The two pillars in one paragraph</H2>
        <P>
          pi-epicflow ships <Strong>two independent skills</Strong> in one
          package. <Strong>Epic workflow</Strong>{" "}
          (<Code>epic-feature-workflow</Code>) decomposes multi-feature
          deliverables into a worktree-per-feature DAG and ships one PR to
          main. <Strong>Project memory</Strong> (<Code>project-memory</Code>)
          gives every pi session in the repo a persistent, file-based brain
          at <Code>.pi/project/</Code>. You can use either alone. They
          reinforce each other when used together.
        </P>

        <H2>How to read these docs</H2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-surface/40 border border-slate-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-vibrant-green" />
              <span className="font-bold text-white text-sm">If you&apos;re new</span>
            </div>
            <P>
              Read the{" "}
              <a className="text-vibrant-green hover:underline" href="#/blog/complete-guide">
                complete operator&apos;s guide
              </a>{" "}
              on the blog first &mdash; that&apos;s a narrative
              walkthrough with a fictional through-line project. Come
              back here for the cold reference.
            </P>
          </div>
          <div className="bg-slate-surface/40 border border-slate-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Compass className="w-4 h-4 text-vibrant-green" />
              <span className="font-bold text-white text-sm">If you already know the shape</span>
            </div>
            <P>
              Use these as lookup tables. Every command, persona, artifact,
              and halt code has its own page with the precise contract.
            </P>
          </div>
        </div>

        <H2>Which page to open depending on what you want to learn</H2>

        <div className="overflow-x-auto mb-6 rounded-2xl border border-slate-border">
          <table className="w-full text-sm">
            <thead className="bg-slate-surface/60">
              <tr className="text-left">
                <th className="p-3 font-semibold text-white">You want to&hellip;</th>
                <th className="p-3 font-semibold text-white">Open</th>
              </tr>
            </thead>
            <tbody className="text-text-muted">
              <tr className="border-t border-slate-border">
                <td className="p-3">Run a slash command from inside pi</td>
                <td className="p-3"><a href="#/docs/commands" className="text-vibrant-green hover:underline">Slash commands</a></td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3">Drive the workflow from a shell script</td>
                <td className="p-3"><a href="#/docs/scripts" className="text-vibrant-green hover:underline">CLI scripts</a></td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3">Understand what a sub-agent does and how to delegate to it</td>
                <td className="p-3"><a href="#/docs/agents" className="text-vibrant-green hover:underline">Personas</a></td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3">Learn how the skills autoload and when each fires</td>
                <td className="p-3"><a href="#/docs/skills" className="text-vibrant-green hover:underline">Skills</a></td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3">Look up an entry-id scheme (DEC, BL, C, G, Q, GC, GD)</td>
                <td className="p-3"><a href="#/docs/brain" className="text-vibrant-green hover:underline">Brain artifacts</a></td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3">See the trigger phrases that produce brain entries</td>
                <td className="p-3"><a href="#/docs/triggers" className="text-vibrant-green hover:underline">Trigger phrases</a></td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3">Recover from a halt during an epic run</td>
                <td className="p-3"><a href="#/docs/halts" className="text-vibrant-green hover:underline">Halt codes</a></td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3">Configure an epic, set caps, or wire the global overlay</td>
                <td className="p-3"><a href="#/docs/config" className="text-vibrant-green hover:underline">Install &amp; config</a></td>
              </tr>
            </tbody>
          </table>
        </div>

        <H2>Authoritative sources</H2>
        <P>
          These docs summarize the in-repo specs but the canonical
          sources always win on a tie:
        </P>
        <Ul>
          <Li><Code>skills/epic-feature-workflow/SKILL.md</Code> &mdash; pillar 1 contract</Li>
          <Li><Code>skills/project-memory/SKILL.md</Code> &mdash; pillar 2 contract</Li>
          <Li><Code>agents/*.md</Code> &mdash; each persona&apos;s exact system prompt</Li>
          <Li><Code>prompts/*.md</Code> &mdash; each slash command&apos;s exact spec</Li>
          <Li><Code>CHANGELOG.md</Code> &mdash; lessons (L-NNN) and behavior changes</Li>
        </Ul>

        <Callout kind="info" title="Versioning">
          These docs match <Code>pi-epicflow@0.14.1</Code>. Slash command
          names, persona names, brain artifact shapes, and halt codes are
          considered stable from v0.14 forward but may change in v0.15
          (a deliberate last-chance break before v1.0). Check the
          {" "}
          <a className="text-vibrant-green hover:underline" href={`${REPO}/blob/main/CHANGELOG.md`}>
            CHANGELOG
          </a>{" "}
          on each upgrade.
        </Callout>

        <H2>One last thing &mdash; <Em>read</Em> as well as look up</H2>
        <P>
          Reference docs answer &ldquo;what&rdquo; and &ldquo;how&rdquo;.
          They are deliberately thin on &ldquo;why&rdquo;. The blog posts
          carry the rationale &mdash; especially the{" "}
          <a className="text-vibrant-green hover:underline" href="#/blog/complete-guide">
            complete operator&apos;s guide
          </a>{" "}
          and the{" "}
          <a className="text-vibrant-green hover:underline" href="#/blog/project-memory">
            project memory deep-dive
          </a>. If a reference page makes you go &ldquo;but <Em>why</Em>?&rdquo;,
          the answer is in a blog post.
        </P>

        <div className="mt-12 pt-6 border-t border-slate-border flex flex-wrap gap-3 text-sm text-text-muted">
          <a href="#/docs" className="text-vibrant-green hover:underline">All docs</a>
          <span>&middot;</span>
          <a href="#/blog" className="text-vibrant-green hover:underline">Blog</a>
          <span>&middot;</span>
          <a href={REPO} className="text-vibrant-green hover:underline inline-flex items-center gap-1">
            <Github className="w-4 h-4" /> GitHub
          </a>
        </div>
      </Prose>
    </article>
  );
}
