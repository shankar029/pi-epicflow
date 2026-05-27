/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Layers } from "lucide-react";
import { Prose, H2, H3, P, Strong, Em, Code, Ul, Ol, Li, Pre, Callout } from "../blog-posts/_typography";
import { DocHeader, DocFooter } from "./_shared";

export default function SkillsPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <DocHeader
        eyebrow="Internals"
        Icon={Layers}
        title="Skills"
        subtitle={
          <>
            pi-epicflow ships two skills. They&apos;re fully independent
            &mdash; use either alone &mdash; but they reinforce each other
            when used together.
          </>
        }
      />
      <Prose>
        <H2>What &ldquo;skill&rdquo; means in pi</H2>
        <P>
          A pi skill is a Markdown file (<Code>SKILL.md</Code>) that pi
          loads as part of its system prompt under specific conditions.
          When the skill is loaded, every rule in it becomes part of how
          pi behaves for that session. Skills can be{" "}
          <Strong>autoloaded</Strong> (always-on when a precondition is
          met) or <Strong>on-demand</Strong> (loaded only when invoked).
        </P>

        <H2>The two skills</H2>

        <div className="rounded-2xl border border-vibrant-green/30 bg-vibrant-green/5 p-6 mb-5">
          <div className="flex items-baseline gap-3 mb-3">
            <code className="text-vibrant-green font-mono text-xl font-bold">project-memory</code>
            <span className="text-xs font-mono uppercase tracking-wider text-vibrant-green/80">Pillar 2 &middot; Autoloaded</span>
          </div>
          <P>
            <Strong>Autoloads</Strong> in any repo that contains a{" "}
            <Code>.pi/project/</Code> directory. Makes pi behave like an
            owner of the repo across sessions: reads <Code>index.md</Code>{" "}
            on entry, opens a session in <Code>sessions.md</Code>, watches
            for trigger phrases, refuses stubs, delegates substantive work
            to <Code>epicflow-*</Code> personas.
          </P>
          <P>
            <Strong>Source:</Strong>{" "}
            <a className="text-vibrant-green hover:underline" href="https://github.com/shankar029/pi-epicflow/blob/main/skills/project-memory/SKILL.md">
              skills/project-memory/SKILL.md
            </a>
          </P>
        </div>

        <div className="rounded-2xl border border-amber-300/30 bg-amber-300/5 p-6 mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <code className="text-amber-300 font-mono text-xl font-bold">epic-feature-workflow</code>
            <span className="text-xs font-mono uppercase tracking-wider text-amber-300/80">Pillar 1 &middot; On-demand</span>
          </div>
          <P>
            <Strong>Loads on-demand</Strong> when you invoke an{" "}
            <Code>/epic-*</Code> slash command or call any <Code>pi-epic-*</Code>{" "}
            / <Code>pi-feature-*</Code> CLI script. Defines the
            three-command epic ritual (design → decompose → run-auto), the
            auto-mode orchestration loop, halt codes H1&ndash;H7, and the
            deviation distillation that produces <Code>lessons.md</Code>.
          </P>
          <P>
            <Strong>Source:</Strong>{" "}
            <a className="text-amber-300 hover:underline" href="https://github.com/shankar029/pi-epicflow/blob/main/skills/epic-feature-workflow/SKILL.md">
              skills/epic-feature-workflow/SKILL.md
            </a>
          </P>
        </div>

        <H2>How autoload works (project-memory)</H2>
        <P>
          When pi starts in a directory that contains{" "}
          <Code>.pi/project/index.md</Code>, the{" "}
          <Code>project-memory</Code> skill&apos;s YAML frontmatter
          condition matches and the skill is loaded automatically &mdash;
          no <Code>/load-skill</Code> needed, no slash command. From that
          point pi:
        </P>
        <Ol>
          <Li>Reads <Code>.pi/project/index.md</Code> before answering anything non-trivial.</Li>
          <Li>Follows the routing table to load <Code>charter.md</Code> + <Code>conventions.md</Code> by default.</Li>
          <Li>If <Code>~/.pi/global-memory/index.md</Code> exists, loads its overlay (additive; per-repo wins on conflict).</Li>
          <Li>Asks for the session goal and opens an entry in <Code>sessions.md</Code>.</Li>
          <Li>Watches for trigger phrases on every turn.</Li>
        </Ol>

        <H2>How on-demand works (epic-feature-workflow)</H2>
        <P>
          The <Code>epic-feature-workflow</Code> skill loads when:
        </P>
        <Ul>
          <Li>You invoke any <Code>/epic-*</Code> slash command (the prompt file declares the skill as required).</Li>
          <Li>You ask pi to drive an existing epic (&ldquo;run the next feature&rdquo;, &ldquo;status of epic 0001&rdquo;) and pi detects <Code>.pi/epics/</Code> in the repo.</Li>
          <Li>You explicitly request it (<Code>/load-skill epic-feature-workflow</Code>).</Li>
        </Ul>
        <P>
          Once loaded, pi knows the orchestration loop, the worktree
          discipline, the halt codes, and how to delegate to{" "}
          <Code>feature-*</Code> personas.
        </P>

        <H2>How the two skills interact</H2>
        <P>
          When both are active (the common case), the integration points
          are:
        </P>
        <Ul>
          <Li>Every <Code>feature-worker</Code> spawned during <Code>/epic-run-auto</Code> primes on <Code>.pi/project/charter.md</Code> + <Code>conventions.md</Code> &mdash; so epic features inherit your project&apos;s anti-stub rule, style conventions, and goals.</Li>
          <Li><Code>/epic-design</Code> reads <Code>decisions.md</Code> so the new design honors existing technical decisions.</Li>
          <Li><Code>/epic-decompose</Code> reads <Code>lessons.md</Code> (from past epics) to avoid known decomposition pitfalls.</Li>
          <Li>When an epic ships, <Code>pi-epic-complete</Code> distills <Code>deviations.md</Code> into <Code>lessons.md</Code> &mdash; which the next <Code>/epic-decompose</Code> will read.</Li>
          <Li>If a halt fires during an epic, the user&apos;s recovery decisions can produce <Code>DEC-NNN</Code> entries via trigger phrases &mdash; brain captures lessons from epic friction.</Li>
        </Ul>

        <Callout kind="info" title="You can use one without the other">
          A repo with <Code>.pi/project/</Code> but no <Code>.pi/epics/</Code>:
          project-memory works fully; epic workflow is dormant until you
          run <Code>pi-epic-init</Code>. A repo with <Code>.pi/epics/</Code>{" "}
          but no <Code>.pi/project/</Code>: epic workflow works fully;
          features won&apos;t prime on a brain (they fall back to{" "}
          <Code>AGENTS.md</Code> + <Code>CHANGELOG.md</Code>). Neither
          mode is degraded; they&apos;re just narrower.
        </Callout>

        <H2>Where each skill&apos;s contract lives</H2>

        <div className="overflow-x-auto mb-6 rounded-2xl border border-slate-border">
          <table className="w-full text-sm">
            <thead className="bg-slate-surface/60">
              <tr className="text-left">
                <th className="p-3 font-semibold text-white">Skill</th>
                <th className="p-3 font-semibold text-white">Primary file</th>
                <th className="p-3 font-semibold text-white">Templates &amp; helpers</th>
              </tr>
            </thead>
            <tbody className="text-text-muted">
              <tr className="border-t border-slate-border">
                <td className="p-3"><Code>project-memory</Code></td>
                <td className="p-3 font-mono text-xs">skills/project-memory/SKILL.md</td>
                <td className="p-3"><Code>templates/project/</Code> · <Code>templates/global/</Code></td>
              </tr>
              <tr className="border-t border-slate-border">
                <td className="p-3"><Code>epic-feature-workflow</Code></td>
                <td className="p-3 font-mono text-xs">skills/epic-feature-workflow/SKILL.md</td>
                <td className="p-3"><Code>scripts/</Code> + <Code>scripts-win/</Code> · <Code>lib/</Code> helpers · template <Code>epic.tmpl/</Code></td>
              </tr>
            </tbody>
          </table>
        </div>

        <H3>Reading the contracts directly</H3>
        <Pre>{`# After install, view either skill's rules:
cat ~/.pi/agent/skills/project-memory/SKILL.md
cat ~/.pi/agent/skills/epic-feature-workflow/SKILL.md

# Or from the repo:
cat skills/project-memory/SKILL.md
cat skills/epic-feature-workflow/SKILL.md`}</Pre>

        <H2>Related</H2>
        <Ul>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/brain">Brain artifacts</a> &mdash; the 9 files project-memory reads &amp; writes.</Li>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/triggers">Trigger phrases</a> &mdash; the vocabulary project-memory watches for.</Li>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/halts">Halt codes</a> &mdash; how epic-feature-workflow stops cleanly.</Li>
          <Li><a className="text-vibrant-green hover:underline" href="#/docs/agents">Personas</a> &mdash; the sub-agents each skill delegates to.</Li>
        </Ul>

        <DocFooter />
      </Prose>
    </article>
  );
}

