/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Reference documentation index + page shell.
 *
 * Mirrors Blog.tsx exactly: hash route at #/docs (index) and
 * #/docs/<slug> (individual reference page). Zero deps — same tiny
 * router shape; we extend `useHashRoute` in App.tsx to recognize the
 * new "docs-*" route kinds.
 */

import { motion } from "motion/react";
import {
  ArrowLeft,
  BookOpen,
  Terminal,
  Users,
  Brain,
  Layers,
  AlertTriangle,
  Settings,
  Sparkles,
  Map,
  GitBranch,
} from "lucide-react";
import type { ComponentType } from "react";

import OverviewPage from "./docs-pages/overview";
import CommandsPage from "./docs-pages/commands";
import ScriptsPage from "./docs-pages/scripts";
import AgentsPage from "./docs-pages/agents";
import SkillsPage from "./docs-pages/skills";
import WorktreesPage from "./docs-pages/worktrees";
import BrainPage from "./docs-pages/brain";
import TriggersPage from "./docs-pages/triggers";
import HaltsPage from "./docs-pages/halts";
import ConfigPage from "./docs-pages/config";

const REPO = "https://github.com/shankar029/pi-epicflow";

// ---------- Doc registry ----------

type DocMeta = {
  slug: string;
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  group: "Start here" | "Surfaces" | "Internals" | "Reference";
  Component: ComponentType;
};

export const docs: DocMeta[] = [
  {
    slug: "overview",
    title: "Overview & how to navigate",
    subtitle:
      "What's in this docs section, how the two pillars relate, and which page to open first depending on what you want to learn.",
    icon: Map,
    group: "Start here",
    Component: OverviewPage,
  },
  {
    slug: "commands",
    title: "Slash commands",
    subtitle:
      "All 9 slash commands you can invoke from inside pi: /project-init, /epic-design, /epic-decompose, /epic-run-auto, /project-review, /project-onboard, /project-init-global, /epic-review-design, /session-end.",
    icon: Terminal,
    group: "Surfaces",
    Component: CommandsPage,
  },
  {
    slug: "scripts",
    title: "CLI scripts (pi-epic-*, pi-feature-*)",
    subtitle:
      "The 9 shell scripts the slash commands and orchestrator delegate to. You can also call them directly from a terminal for scripted workflows.",
    icon: Terminal,
    group: "Surfaces",
    Component: ScriptsPage,
  },
  {
    slug: "agents",
    title: "Personas (sub-agents)",
    subtitle:
      "All 11 sub-agent personas: 5 epicflow-* (scout/researcher/worker/reviewer/oracle/steward), 4 feature-* (planner/worker/reviewer/epic-reviewer), and epic-design-critic.",
    icon: Users,
    group: "Internals",
    Component: AgentsPage,
  },
  {
    slug: "skills",
    title: "Skills",
    subtitle:
      "The two skills that ship with pi-epicflow: epic-feature-workflow (pillar 1, on-demand) and project-memory (pillar 2, autoloaded).",
    icon: Layers,
    group: "Internals",
    Component: SkillsPage,
  },
  {
    slug: "worktrees",
    title: "Worktree topology",
    subtitle:
      "Where each branch actually lives on disk: epic vs feature, the two top-level patterns (default vs dedicated epic worktree), which scripts create which, and how cleanup works.",
    icon: GitBranch,
    group: "Internals",
    Component: WorktreesPage,
  },
  {
    slug: "brain",
    title: "Brain artifacts",
    subtitle:
      "The 9 files in .pi/project/ and the global overlay in ~/.pi/global-memory/. Includes ID schemes, capacity caps, rollover recipe, and append-only rules.",
    icon: Brain,
    group: "Reference",
    Component: BrainPage,
  },
  {
    slug: "triggers",
    title: "Trigger phrases",
    subtitle:
      "Every trigger phrase the agent watches for and the artifact it produces. The vocabulary that grows your brain without slash commands.",
    icon: Sparkles,
    group: "Reference",
    Component: TriggersPage,
  },
  {
    slug: "halts",
    title: "Halt codes (H1–H7)",
    subtitle:
      "When and why the orchestrator halts an epic instead of guessing, what each code means, and the recipe to recover from each.",
    icon: AlertTriangle,
    group: "Reference",
    Component: HaltsPage,
  },
  {
    slug: "config",
    title: "Install & configuration",
    subtitle:
      "Install paths, epic-config.yaml fields, global overlay layout, environment variables, and what postinstall actually does.",
    icon: Settings,
    group: "Reference",
    Component: ConfigPage,
  },
];

const docBySlug = (slug: string) => docs.find((d) => d.slug === slug);

// ---------- Index ----------

const groups: Array<DocMeta["group"]> = [
  "Start here",
  "Surfaces",
  "Internals",
  "Reference",
];

export const DocsIndex = () => (
  <section className="px-4 py-16 md:py-20 max-w-5xl mx-auto">
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-12 text-center"
    >
      <div className="inline-flex items-center gap-2 bg-vibrant-green/10 text-vibrant-green text-xs font-bold font-mono px-3 py-1 rounded-full border border-vibrant-green/20 mb-5 uppercase tracking-widest">
        <BookOpen className="w-3 h-3" />
        Reference docs · v0.14.1
      </div>
      <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
        pi-epicflow <span className="text-vibrant-green">reference</span>
      </h1>
      <p className="text-text-muted text-lg max-w-2xl mx-auto leading-relaxed">
        Every surface, every persona, every artifact. New here? Start with{" "}
        <a className="text-vibrant-green hover:underline" href="#/docs/overview">
          Overview &amp; how to navigate
        </a>{" "}
        or read the{" "}
        <a className="text-vibrant-green hover:underline" href="#/blog/complete-guide">
          complete operator&apos;s guide
        </a>{" "}
        on the blog for a narrative walkthrough first.
      </p>
    </motion.div>

    {groups.map((g) => {
      const groupDocs = docs.filter((d) => d.group === g);
      if (groupDocs.length === 0) return null;
      return (
        <div key={g} className="mb-10">
          <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-vibrant-green mb-4">
            {g}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupDocs.map((d, i) => {
              const Icon = d.icon;
              return (
                <motion.a
                  key={d.slug}
                  href={`#/docs/${d.slug}`}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className="bg-slate-surface border border-slate-border rounded-2xl p-5 md:p-6 hover:border-vibrant-green/40 transition-all group relative overflow-hidden block"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="bg-vibrant-green/10 border border-vibrant-green/20 rounded-lg p-2 flex-shrink-0">
                      <Icon className="w-4 h-4 text-vibrant-green" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-white leading-tight group-hover:text-vibrant-green transition-colors">
                      {d.title}
                    </h3>
                  </div>
                  <p className="text-text-muted text-sm leading-relaxed">
                    {d.subtitle}
                  </p>
                </motion.a>
              );
            })}
          </div>
        </div>
      );
    })}

    <div className="mt-12 text-center text-sm text-text-muted">
      <p className="mb-3">
        Looking for design rationale and walkthroughs instead?{" "}
        <a className="text-vibrant-green hover:underline" href="#/blog">
          Browse the blog &rarr;
        </a>
      </p>
      <a
        href="/"
        className="text-vibrant-green hover:underline inline-flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" /> Back to landing
      </a>
    </div>
  </section>
);

// ---------- Page shell ----------

export const DocShell = ({ slug }: { slug: string }) => {
  const doc = docBySlug(slug);
  if (!doc) {
    return (
      <section className="px-4 py-20 max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Doc not found</h1>
        <p className="text-text-muted mb-8">
          We couldn&apos;t find a doc with slug{" "}
          <code className="text-vibrant-green font-mono">{slug}</code>.
        </p>
        <a href="#/docs" className="text-vibrant-green hover:underline">
          Back to all docs
        </a>
      </section>
    );
  }
  const Body = doc.Component;
  return (
    <>
      <div className="border-b border-slate-border bg-surface/40">
        <div className="max-w-3xl mx-auto px-4 py-3 text-sm flex items-center justify-between">
          <a
            href="#/docs"
            className="text-text-muted hover:text-vibrant-green transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> All docs
          </a>
          <a
            href={`${REPO}/blob/main/site/src/docs-pages/${doc.slug}.tsx`}
            className="text-text-muted hover:text-vibrant-green transition-colors text-xs font-mono"
          >
            Source on GitHub &rarr;
          </a>
        </div>
      </div>
      <Body />
    </>
  );
};
