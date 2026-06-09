/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Quickstart page. Top-level hash route at #/quickstart.
 * Walks a new visitor through:
 *   1. Install pi (the underlying coding agent)
 *   2. Install pi-epicflow (this package)
 *   3. Verify
 *   4. First-use paths (project-memory only / epic-only / both)
 */

import type { ReactNode } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Rocket,
  CheckCircle2,
  Brain,
  GitBranch,
  AlertTriangle,
  BookOpen,
} from "lucide-react";

// Reuse the typography primitives from blog posts for consistent style.
import { P, Strong, Em, Code, Ul, Li, Pre, Callout } from "./blog-posts/_typography";

const REPO = "https://github.com/shankar029/pi-epicflow";

const Step = ({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4 }}
    className="mb-12"
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-vibrant-green/15 border border-vibrant-green/40 flex items-center justify-center text-vibrant-green font-black text-lg">
        {n}
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-white">{title}</h2>
    </div>
    <div className="pl-0 md:pl-[3.25rem]">{children}</div>
  </motion.div>
);

export const Quickstart = () => (
  <article className="max-w-3xl mx-auto px-4 py-12 md:py-16">
    {/* Header */}
    <motion.header
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      <div className="inline-flex items-center gap-2 bg-vibrant-green/10 text-vibrant-green text-xs font-bold font-mono px-3 py-1 rounded-full border border-vibrant-green/20 mb-5 uppercase tracking-widest">
        <Rocket className="w-3 h-3" />
        Quickstart &middot; v0.14.1
      </div>
      <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
        Get pi-epicflow <span className="text-vibrant-green">running in 5 minutes</span>
      </h1>
      <p className="text-text-muted text-lg leading-relaxed">
        Two installs, one verify, then pick your first-use path. macOS,
        Linux, WSL, and Windows (PowerShell 7+) are all supported.
      </p>
    </motion.header>

    <Callout kind="info" title="Reminder: pi-epicflow is a plugin">
      It runs <Em>inside</Em>{" "}
      <a className="text-vibrant-green hover:underline" href="https://pi.dev">
        pi
      </a>
      , an open-source terminal coding agent in the same family as Claude
      Code, Aider, and Cursor&apos;s CLI. You install pi first, then this
      package adds skills, slash commands, sub-agents, and CLI scripts on
      top.
    </Callout>

    {/* Step 1 */}
    <Step n={1} title="Install pi">
      <P>
        If you already have pi (verify with <Code>pi --version</Code>{" "}
        &mdash; need <Strong>&ge; 0.74</Strong>), skip to step 2.
      </P>
      <P>
        Otherwise, install via the official installer at{" "}
        <a className="text-vibrant-green hover:underline" href="https://pi.dev">
          pi.dev
        </a>
        . The one-line installer works on all supported platforms:
      </P>
      <Pre>{`# macOS / Linux / WSL:
curl -fsSL https://pi.dev/install.sh | sh

# Windows (PowerShell 7+):
irm https://pi.dev/install.ps1 | iex

# Verify:
pi --version    # should report >= 0.74`}</Pre>
      <Callout kind="info" title="Why pi specifically">
        pi-epicflow is built on pi&apos;s skill, slash-command, and
        sub-agent primitives. The architecture isn&apos;t portable to
        other agents &mdash; the orchestrator, persona system, and
        autoload behavior are pi-specific.
      </Callout>
    </Step>

    {/* Step 2 */}
    <Step n={2} title="Install pi-epicflow">
      <P>
        <Strong>Recommended &mdash; from npm</Strong> (auto-updates with{" "}
        <Code>pi update</Code>):
      </P>
      <Pre>{`# Pin to the 0.14 minor (recommended for stability):
pi install npm:pi-epicflow@^0.14

# Or pull the latest published version:
pi install npm:pi-epicflow`}</Pre>
      <P>
        <Strong>Alternative &mdash; from git</Strong> (use only if you
        need an unreleased commit or want to test a fork):
      </P>
      <Pre>{`# Latest main:
pi install git:github.com/shankar029/pi-epicflow

# Specific tag:
pi install git:github.com/shankar029/pi-epicflow@v0.14.1`}</Pre>
      <Callout kind="info" title="What postinstall does">
        Registers two skills (<Code>project-memory</Code>,{" "}
        <Code>epic-feature-workflow</Code>), copies 11 sub-agent personas
        into <Code>~/.pi/agent/agents/</Code>, symlinks 9 CLI scripts into{" "}
        <Code>~/.local/bin/</Code>, and auto-installs the two dependent pi
        packages (<Code>pi-subagents</Code> required, <Code>pi-intercom</Code>{" "}
        optional). Idempotent &mdash; safe to re-run. See{" "}
        <a className="text-vibrant-green hover:underline" href="#/docs/config">
          Install &amp; config
        </a>{" "}
        for the full layout.
      </Callout>

      <Callout kind="warn" title="Linux / WSL / macOS: npm permissions gotcha">
        On most Linux/WSL/macOS systems, the global npm prefix is{" "}
        <Code>/usr/local</Code> (root-owned), and{" "}
        <Code>pi install npm:pi-epicflow</Code> shells out to{" "}
        <Code>npm install -g</Code>. You&apos;ll see an{" "}
        <Code>EACCES</Code> error like:
        <Pre>{`npm ERR! code EACCES
npm ERR! syscall rename
npm ERR! path /usr/local/lib/node_modules/pi-epicflow
npm ERR! Error: EACCES: permission denied, rename '/usr/local/lib/...'`}</Pre>
        <Strong>Fix &mdash; pick one (recommended order):</Strong>
        <Pre>{`# Option A (recommended): re-point npm prefix to a user-owned dir.
#   One-time setup; everything you 'pi install npm:' from now on
#   lives under your home directory.
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc   # or ~/.zshrc
source ~/.bashrc
pi install npm:pi-epicflow@^0.14    # now works without sudo

# Option B: use a node version manager (nvm / fnm / volta). These
#   install node + npm under your home dir by default, eliminating
#   the problem entirely. Best for long-term node usage.
#   nvm:    https://github.com/nvm-sh/nvm
#   fnm:    https://github.com/Schniz/fnm
#   volta:  https://volta.sh

# Option C (NOT recommended): use sudo.
#   sudo pi install npm:pi-epicflow@^0.14
#   Avoid because pi-epicflow's postinstall writes to ~/.pi/ &
#   ~/.local/bin -- doing that as root creates files your user can't
#   later modify. Will bite you on the next upgrade.

# Option D (fallback): use the git source.
#   pi install git:github.com/shankar029/pi-epicflow
#   Bypasses npm entirely. You lose 'pi update' refresh semantics --
#   to upgrade you have to re-run the install command.`}</Pre>
        Windows users on PowerShell typically don&apos;t hit this since
        npm&apos;s default prefix is already under <Code>%AppData%</Code>.
      </Callout>

    </Step>

    {/* Step 3 */}
    <Step n={3} title="Verify the install">
      <Pre>{`# Doctor checks all 5 install surfaces and prints a green/red status:
pi-epicflow-doctor

# Expected (paraphrased):
\u2713 pi-epicflow at ~/.pi/agent/skills/epic-feature-workflow/  (v0.14.1)
\u2713 Skills registered (project-memory + epic-feature-workflow)
\u2713 11 personas in ~/.pi/agent/agents/
\u2713 9 CLI scripts on PATH
\u2713 pi-subagents present (required dependency)
\u24d8  Global overlay: not initialized (optional; run /project-init-global in pi)`}</Pre>
      <P>
        If any line is red, the doctor prints a one-line fix recipe under
        the failure. The most common issue is a stale <Code>PATH</Code>{" "}
        &mdash; open a new terminal and re-run.
      </P>
    </Step>

    {/* Step 4 */}
    <Step n={4} title="Pick your first-use path">
      <P>
        pi-epicflow has two independent pillars. You don&apos;t have to
        use both. Pick the one that solves your current pain:
      </P>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6 mb-6">
        {/* Path A — project memory */}
        <a
          href="#path-a"
          className="bg-slate-surface border border-slate-border rounded-2xl p-5 hover:border-vibrant-green/40 transition-all"
        >
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-vibrant-green" />
            <h3 className="font-bold text-white">Path A &mdash; Project memory</h3>
          </div>
          <p className="text-sm text-text-muted leading-relaxed">
            Your sessions keep forgetting decisions, conventions, and what
            you tried last time. Start here if that&apos;s your pain.
          </p>
        </a>

        {/* Path B — epic workflow */}
        <a
          href="#path-b"
          className="bg-slate-surface border border-slate-border rounded-2xl p-5 hover:border-vibrant-green/40 transition-all"
        >
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-white">Path B &mdash; Epic workflow</h3>
          </div>
          <p className="text-sm text-text-muted leading-relaxed">
            You have a 5&ndash;60 feature spec and want one reviewable PR
            instead of an unreviewable 5,000-line dump.
          </p>
        </a>

        {/* Path C — both */}
        <a
          href="#path-c"
          className="bg-slate-surface border border-slate-border rounded-2xl p-5 hover:border-vibrant-green/40 transition-all"
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-fuchsia-400" />
            <h3 className="font-bold text-white">Path C &mdash; Both</h3>
          </div>
          <p className="text-sm text-text-muted leading-relaxed">
            You want the full experience: persistent brain priming every
            epic, lessons feeding the next decomposition.
          </p>
        </a>
      </div>
    </Step>

    {/* Path A */}
    <section id="path-a" className="mb-12 scroll-mt-20">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 flex items-center gap-2">
        <Brain className="w-6 h-6 text-vibrant-green" />
        Path A &mdash; Project memory only
      </h2>
      <p className="text-sm font-mono uppercase tracking-wider text-vibrant-green/70 mb-4">~3 minutes</p>
      <P>
        Run this in any repo you want pi to remember across sessions:
      </P>
      <Pre>{`cd ~/code/your-repo
pi
# Inside pi:
> /project-init

# Pi asks ~6 charter questions (goal, non-goals, owner, quality bar).
# Answer briefly. Scaffolds .pi/project/ with 9 markdown files.
# Add to git:
> exit
git add .pi/project && git commit -m "chore: init project brain"`}</Pre>
      <P>
        That&apos;s it. From now on, every <Code>pi</Code> session in this
        repo autoloads <Code>charter.md</Code> + <Code>conventions.md</Code>{" "}
        and watches for{" "}
        <a className="text-vibrant-green hover:underline" href="#/docs/triggers">
          trigger phrases
        </a>{" "}
        that grow the brain without any slash commands.
      </P>
      <P>
        <Strong>Try it:</Strong> in a normal coding session, say something
        like &ldquo;let&apos;s go with append-only JSONL over SQLite for
        storage &mdash; O(1) writes&rdquo;. Pi will silently append a{" "}
        <Code>DEC-NNN</Code> entry to <Code>decisions.md</Code> on that
        turn. Six weeks from now when a new session asks &ldquo;why JSONL
        not SQLite?&rdquo;, the answer is on disk.
      </P>
      <P>
        <strong className="text-white">Next:</strong>{" "}
        <a className="text-vibrant-green hover:underline" href="#/docs/brain">
          Brain artifacts reference
        </a>{" "}
        &middot;{" "}
        <a className="text-vibrant-green hover:underline" href="#/blog/project-memory">
          Project memory rationale (blog)
        </a>
      </P>
    </section>

    {/* Path B */}
    <section id="path-b" className="mb-12 scroll-mt-20">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 flex items-center gap-2">
        <GitBranch className="w-6 h-6 text-amber-300" />
        Path B &mdash; Epic workflow only
      </h2>
      <p className="text-sm font-mono uppercase tracking-wider text-amber-300/70 mb-4">~10 minutes to first epic running</p>
      <P>
        You need a <Code>design.md</Code> first &mdash; a markdown file
        describing what you want to build. Doesn&apos;t have to be polished;
        pi will help refine it. Two pages minimum, with sections for goals,
        non-goals, key components, and acceptance criteria.
      </P>
      <Pre>{`cd ~/code/your-repo

# Bootstrap the epic from your design:
pi-epic-init http-api --from designs/http-api.md
# \u2713 Created branch epic/http-api
# \u2713 Scaffolded .pi/epics/0001-http-api/

# Now drive it through pi:
pi
> /epic-design          # (optional) co-author the design with pi
> /epic-decompose       # breaks design.md into 5-30 features (DAG)
                        # Review the proposed decomposition.yaml.
                        # Edit, ask pi to revise, until happy.
> /epic-run-auto        # ships every feature: planner -> worker ->
                        # reviewer -> squash-merge into epic branch.
                        # Halts cleanly (H1-H7) when it should.`}</Pre>
      <P>
        When all features have merged, <Code>pi-epic-complete</Code> opens
        one PR to <Code>main</Code> with the full epic. You review the
        single PR, not 30 individual ones.
      </P>
      <Callout kind="warn" title="First epic = pick something small">
        For your first epic, choose 3&ndash;5 features, not 30. Get a feel
        for the halt behavior, the worktree topology, and the rhythm
        before committing a multi-day epic. Below ~3 features, pi-epicflow
        is overkill &mdash; just code by hand.
      </Callout>
      <P>
        <strong className="text-white">Next:</strong>{" "}
        <a className="text-vibrant-green hover:underline" href="#/docs/commands">
          Slash commands reference
        </a>{" "}
        &middot;{" "}
        <a className="text-vibrant-green hover:underline" href="#/docs/worktrees">
          Worktree topology
        </a>{" "}
        &middot;{" "}
        <a className="text-vibrant-green hover:underline" href="#/docs/halts">
          Halt codes
        </a>
      </P>
    </section>

    {/* Path C */}
    <section id="path-c" className="mb-12 scroll-mt-20">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 flex items-center gap-2">
        <CheckCircle2 className="w-6 h-6 text-fuchsia-400" />
        Path C &mdash; Both pillars
      </h2>
      <p className="text-sm font-mono uppercase tracking-wider text-fuchsia-400/70 mb-4">~15 minutes</p>
      <P>The most rewarding setup. Do Path A first, then layer Path B on top:</P>
      <Pre>{`cd ~/code/your-repo

# 1. Brain first:
pi
> /project-init
> exit
git add .pi/project && git commit -m "chore: init project brain"

# 2. (Optional, once per machine) Global overlay for cross-repo defaults:
pi
> /project-init-global
> exit

# 3. Now bootstrap an epic. Every feature worker will auto-prime on
#    your charter + conventions, and any decisions you make get
#    appended to decisions.md without you running a single command.
pi-epic-init http-api --from designs/http-api.md
pi
> /epic-decompose
> /epic-run-auto`}</Pre>
      <P>
        The compound benefit: when the epic ships, deviations get distilled
        into <Code>lessons.md</Code>, which the <Em>next</Em> epic&apos;s
        <Code>/epic-decompose</Code> reads automatically. After 3&ndash;5
        epics, your decompositions visibly improve without you doing
        anything explicit.
      </P>
      <P>
        <strong className="text-white">Next:</strong>{" "}
        <a className="text-vibrant-green hover:underline" href="#/blog/complete-guide">
          Complete operator&apos;s guide (28-min read, both pillars
          end-to-end)
        </a>
      </P>
    </section>

    {/* Troubleshooting */}
    <section className="mb-12">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 flex items-center gap-2">
        <AlertTriangle className="w-6 h-6 text-amber-300" />
        Troubleshooting
      </h2>
      <Ul>
        <Li>
          <Strong>
            <Code>EACCES</Code> on{" "}
            <Code>pi install npm:pi-epicflow</Code>
          </Strong>{" "}
          &mdash; your global npm prefix is root-owned. Re-point npm to a
          user-owned dir (see <em>Linux / WSL / macOS gotcha</em> callout
          in step 2 above) or fall back to the git install:{" "}
          <Code>pi install git:github.com/shankar029/pi-epicflow</Code>.
        </Li>
        <Li>
          <Strong>
            <Code>pi: command not found</Code>
          </Strong>{" "}
          &mdash; pi&apos;s installer adds itself to <Code>~/.local/bin</Code>{" "}
          (Unix) or <Code>%USERPROFILE%\.local\bin</Code> (Windows). Open a
          new terminal so the new <Code>PATH</Code> is picked up, or
          source your shell rc directly.
        </Li>
        <Li>
          <Strong>
            <Code>pi install npm:pi-epicflow</Code> 404
          </Strong>{" "}
          &mdash; package is published at{" "}
          <a className="text-vibrant-green hover:underline" href="https://www.npmjs.com/package/pi-epicflow">
            npmjs.com/package/pi-epicflow
          </a>
          . If npm is down or you&apos;re offline, fall back to the git
          source: <Code>pi install git:github.com/shankar029/pi-epicflow</Code>.
        </Li>
        <Li>
          <Strong>Smoke test fails on Windows</Strong> &mdash; ensure
          you&apos;re on PowerShell 7+ (<Code>pwsh --version</Code>), not
          Windows PowerShell 5.1. PowerShell 7 is a separate install from{" "}
          <a className="text-vibrant-green hover:underline" href="https://github.com/PowerShell/PowerShell">
            github.com/PowerShell/PowerShell
          </a>
          .
        </Li>
        <Li>
          <Strong>Stuck or surprised by behavior</Strong> &mdash; check{" "}
          <a className="text-vibrant-green hover:underline" href={`${REPO}/issues`}>
            existing issues
          </a>{" "}
          first; if no match, file one with <Code>pi-epicflow-doctor</Code>{" "}
          output attached.
        </Li>
      </Ul>
    </section>

    {/* Where next */}
    <section className="border-t border-slate-border pt-10 text-center">
      <BookOpen className="w-6 h-6 text-vibrant-green mx-auto mb-3" />
      <h2 className="text-xl font-bold text-white mb-3">Where to go next</h2>
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        <a href="#/docs" className="bg-slate-surface border border-slate-border text-white px-5 py-2.5 rounded-xl text-sm hover:border-vibrant-green/50 transition-all">
          Full docs reference
        </a>
        <a href="#/blog/complete-guide" className="bg-slate-surface border border-slate-border text-white px-5 py-2.5 rounded-xl text-sm hover:border-vibrant-green/50 transition-all">
          Complete operator&apos;s guide
        </a>
        <a href="#/blog" className="bg-slate-surface border border-slate-border text-white px-5 py-2.5 rounded-xl text-sm hover:border-vibrant-green/50 transition-all">
          All blog posts
        </a>
      </div>
      <a
        href="/"
        className="text-vibrant-green hover:underline inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to landing
      </a>
    </section>
  </article>
);
