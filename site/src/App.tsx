/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import {
  Terminal,
  Github,
  GitBranch,
  Layers,
  FileCode,
  CheckCircle2,
  XCircle,
  Flag,
  Copy,
  Brain,
  Lightbulb,
  ClipboardCheck,
  ShieldCheck,
} from "lucide-react";
import { BlogIndex, PostShell, useHashRoute } from "./Blog";

const REPO = "https://github.com/shankar029/pi-epicflow";

const Navbar = () => (
  <header className="bg-surface/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-border">
    <div className="flex justify-between items-center w-full px-4 md:px-10 max-w-7xl mx-auto h-16">
      <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
        <Terminal className="text-vibrant-green w-6 h-6" />
        <span className="text-white">pi-epicflow</span>
        <span className="ml-2 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-vibrant-green border border-vibrant-green/30 rounded">
          v0.14.0
        </span>
      </div>
      <nav className="hidden md:flex gap-8 items-center text-sm font-medium">
        <a href={`${REPO}#readme`} className="text-text-muted hover:text-vibrant-green transition-colors">Docs</a>
        <a href="#/blog" className="text-text-muted hover:text-vibrant-green transition-colors">Blog</a>
        <a href={`${REPO}/blob/main/CHANGELOG.md`} className="text-text-muted hover:text-vibrant-green transition-colors">Changelog</a>
        <a href={REPO} className="text-text-muted hover:text-vibrant-green transition-colors">GitHub</a>
      </nav>
      <div>
        <a href={`${REPO}#install`} className="inline-block bg-vibrant-green hover:bg-vibrant-green-hover text-surface px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-[0_0_20px_rgba(34,197,94,0.15)]">
          Install
        </a>
      </div>
    </div>
  </header>
);

const Hero = () => (
  <section className="px-4 py-20 md:py-28 max-w-7xl mx-auto text-center relative">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-vibrant-green/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="inline-flex items-center gap-2 bg-vibrant-green/10 text-vibrant-green text-xs font-bold font-mono px-4 py-1.5 rounded-full border border-vibrant-green/20 mb-6 uppercase tracking-widest"
    >
      <Brain className="w-3 h-3" />
      v0.14 — phase 2 brain + global overlay
    </motion.div>

    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="text-4xl md:text-6xl font-black text-white mb-6 max-w-4xl mx-auto leading-tight"
    >
      Ship multi-feature work as <span className="text-vibrant-green">one clean PR</span>
    </motion.h1>

    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="text-lg md:text-xl text-text-muted mb-10 max-w-2xl mx-auto leading-relaxed"
    >
      A <a href="https://pi.dev" className="text-vibrant-green hover:underline">pi</a> extension
      with two pillars. <strong className="text-white">Epic workflow:</strong> decompose
      a <code className="text-vibrant-green font-mono">design.md</code> into a DAG of small
      features, run each on its own git worktree, squash-merge back into one reviewable PR.
      <strong className="text-white"> Project memory (new in v0.13, expanded in v0.14):</strong> a
      persistent file-based brain at <code className="text-vibrant-green font-mono">.pi/project/</code> plus
      an opt-in cross-repo overlay at <code className="text-vibrant-green font-mono">~/.pi/global-memory/</code> so pi
      sessions stop forgetting decisions across runs.
      Plans before it codes. Halts when it should.
    </motion.p>

    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="flex flex-col sm:flex-row items-center justify-center gap-4"
    >
      <a href={`${REPO}#quickstart--the-three-command-flow`} className="w-full sm:w-auto bg-vibrant-green hover:bg-vibrant-green-hover text-surface px-10 py-4 rounded-xl font-bold uppercase tracking-wider transition-colors text-center">
        Quickstart
      </a>
      <a href={REPO} className="w-full sm:w-auto bg-slate-surface border border-slate-border text-white px-10 py-4 rounded-xl font-bold uppercase tracking-wider hover:border-vibrant-green/50 hover:bg-surface-container transition-all flex items-center justify-center gap-2">
        <Github className="w-5 h-5" />
        View on GitHub
      </a>
    </motion.div>
  </section>
);

const BenefitCard = ({ icon: Icon, title, description, delay = 0, colorClass = "text-vibrant-green" }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="bg-slate-surface border border-slate-border rounded-3xl p-8 hover:border-vibrant-green/30 transition-all relative group overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="w-12 h-12 bg-surface-container rounded-2xl flex items-center justify-center mb-6 border border-slate-border relative z-10">
      <Icon className={`w-6 h-6 ${colorClass}`} />
    </div>
    <h3 className="text-xl font-bold text-white mb-3 relative z-10">{title}</h3>
    <p className="text-text-muted leading-relaxed relative z-10">{description}</p>
  </motion.div>
);

const Benefits = () => (
  <section className="px-4 py-16 max-w-7xl mx-auto">
    <div className="text-center mb-12">
      <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
        Why naive "agent in one big context" doesn't scale
      </h2>
      <p className="mt-3 text-text-muted max-w-2xl mx-auto">
        Five problems that show up at the second or third feature. pi-epicflow solves them by structure, not heroics.
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <BenefitCard
        icon={GitBranch}
        title="Fresh context per feature"
        description="Each feature spawns a worker subagent in a clean context. F03's worker doesn't drag F01's 80 KB of tokens into the conversation."
        delay={0.05}
      />
      <BenefitCard
        icon={Layers}
        title="Isolated worktrees"
        description="Every feature gets its own git worktree off the epic branch. No stash/pop, no branch-switching mid-edit, no scope leak."
        delay={0.1}
        colorClass="text-cyan-400"
      />
      <BenefitCard
        icon={FileCode}
        title="Decomposition is YAML, not chat"
        description="Approved once, then binding. Deviations are first-class entries in deviations.md — diffable, reviewable, fed back into lessons.md."
        delay={0.15}
        colorClass="text-emerald-400"
      />
      <BenefitCard
        icon={ClipboardCheck}
        title="Plan before code, always"
        description="Every worker fills a structured Plan section before its first edit. Tagged features get a dedicated feature-planner subagent that writes a binding plan.md."
        delay={0.2}
        colorClass="text-amber-400"
      />
      <BenefitCard
        icon={Lightbulb}
        title="Spikes for decisions"
        description="kind: spike features ship a Decision / Evidence / Impact entry instead of code. Resolve open questions before they corrupt downstream features."
        delay={0.25}
        colorClass="text-fuchsia-400"
      />
      <BenefitCard
        icon={ShieldCheck}
        title="Halts, not guesses"
        description="Eight well-defined halt codes (H1–H7, H9). On any blocker, the orchestrator writes a halt report with the exact resume command and stops. A bad guess at hour 3 wastes hours; a halt loses minutes."
        delay={0.3}
        colorClass="text-rose-400"
      />
    </div>
  </section>
);

const ArchitectureDiagram = () => (
  <div className="bg-slate-surface border border-slate-border rounded-3xl p-6 md:p-10 relative overflow-hidden">
    <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-stretch text-center">
      {[
        { label: "design.md", sub: "you write", color: "border-slate-border text-text-muted" },
        { label: "/epic-decompose", sub: "DAG + AC + tags", color: "border-vibrant-green/40 text-vibrant-green" },
        { label: "feature-planner", sub: "needs_planner: true", color: "border-amber-400/40 text-amber-400" },
        { label: "feature-worker", sub: "plan.md binding", color: "border-cyan-400/40 text-cyan-400" },
        { label: "feature-reviewer", sub: "plan-vs-impl", color: "border-emerald-400/40 text-emerald-400" },
        { label: "feature-epic-reviewer", sub: "cross-feature gate", color: "border-fuchsia-400/40 text-fuchsia-400" },
      ].map((node, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 * i }}
          className={`flex-1 bg-surface-container border ${node.color.split(" ")[0]} rounded-2xl p-4`}
        >
          <div className={`font-mono text-sm font-bold ${node.color.split(" ")[1]}`}>{node.label}</div>
          <div className="text-[11px] font-mono text-text-muted mt-1 uppercase tracking-wider">{node.sub}</div>
        </motion.div>
      ))}
    </div>

    <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs font-mono text-text-muted">
      <span className="flex items-center gap-2">
        <Flag className="w-4 h-4 text-vibrant-green" />
        loop until DAG drained
      </span>
      <span>→ squash-merge into <span className="text-vibrant-green">epic/&lt;slug&gt;</span></span>
      <span>→ epic-review gate → <span className="text-vibrant-green">one PR to main</span></span>
    </div>
  </div>
);

const TerminalWindow = () => (
  <div className="bg-[#0d1117] border border-slate-border rounded-xl overflow-hidden shadow-2xl">
    <div className="bg-[#161b22] border-b border-slate-border px-4 py-3 flex items-center gap-2">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-amber-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
      </div>
      <span className="ml-2 text-xs font-mono text-text-muted">terminal — pi-epicflow</span>
    </div>
    <div className="p-6 font-mono text-xs md:text-sm leading-relaxed relative">
      <button className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors" aria-label="copy">
        <Copy className="w-4 h-4" />
      </button>
      <div className="space-y-1.5">
        <div className="text-text-muted"># install (once)</div>
        <div className="flex gap-3">
          <span className="text-slate-border select-none">$</span>
          <span className="text-white"><span className="text-vibrant-green">pi</span> install git:github.com/shankar029/pi-epicflow</span>
        </div>
        <div className="text-text-muted mt-3"># bootstrap the epic</div>
        <div className="flex gap-3">
          <span className="text-slate-border select-none">$</span>
          <span className="text-white"><span className="text-vibrant-green">pi-epic-init</span> my-feature <span className="text-cyan-400">--from</span> /tmp/design.md</span>
        </div>
        <div className="flex gap-3 opacity-70">
          <span className="text-slate-border select-none">#</span>
          <span className="italic text-text-muted">created branch: epic/my-feature</span>
        </div>
        <div className="flex gap-3">
          <span className="text-slate-border select-none">$</span>
          <span className="text-white"><span className="text-vibrant-green">pi</span></span>
        </div>
        <div className="text-text-muted mt-3"># then in pi:</div>
        <div className="flex gap-3">
          <span className="text-slate-border select-none">›</span>
          <span className="text-amber-400">/epic-decompose</span>
        </div>
        <div className="flex gap-3 opacity-70">
          <span className="text-slate-border select-none">#</span>
          <span className="italic text-text-muted">propose features → you approve → commit</span>
        </div>
        <div className="flex gap-3">
          <span className="text-slate-border select-none">›</span>
          <span className="text-amber-400">/epic-run-auto</span>
        </div>
        <div className="flex gap-3 opacity-70">
          <span className="text-slate-border select-none">#</span>
          <span className="italic text-text-muted">plan → implement → review → squash-merge → repeat → PR</span>
        </div>
      </div>
    </div>
  </div>
);

const WorkflowAndQuickstart = () => (
  <section className="px-4 py-16 max-w-7xl mx-auto">
    <div className="text-center mb-12">
      <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">How it works</h2>
      <p className="mt-3 text-text-muted max-w-2xl mx-auto">
        Three commands. Five subagents (planner gated on tag). One PR.
      </p>
    </div>
    <ArchitectureDiagram />
    <div className="mt-10 grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
      <div className="lg:col-span-2 space-y-4 text-text-muted text-sm leading-relaxed">
        <p>
          <strong className="text-white">1. Decompose.</strong>{" "}
          <code className="text-vibrant-green font-mono text-xs">/epic-decompose</code> reads your design and proposes 3–60 features with deps, scope, and acceptance criteria. A 7-item trigger checklist auto-tags features as <code className="text-amber-400 font-mono text-xs">needs_planner: true</code> when AC are format-sensitive, scope crosses modules, or the dep chain is deep.
        </p>
        <p>
          <strong className="text-white">2. Run.</strong>{" "}
          <code className="text-vibrant-green font-mono text-xs">/epic-run-auto</code> ships every feature: planner pass (if tagged) → worker (binding plan.md) → reviewer (plan-vs-impl) → squash-merge into the epic branch.
        </p>
        <p>
          <strong className="text-white">3. Land.</strong>{" "}
          When every feature has merged, a dedicated{" "}
          <code className="text-fuchsia-400 font-mono text-xs">feature-epic-reviewer</code>{" "}
          audits the cumulative diff for the cross-feature bugs per-feature reviewers can't see (lockfile drift, no-op stubs, design-section coverage gaps, rubber-stamping). Only on{" "}
          <code className="text-vibrant-green font-mono text-xs">Verdict: APPROVE_EPIC</code> does{" "}
          <code className="text-vibrant-green font-mono text-xs">pi-epic-complete</code> open one PR to main. Deviations get distilled into{" "}
          <code className="text-vibrant-green font-mono text-xs">lessons.md</code> so the next epic gets smarter automatically.
        </p>
      </div>
      <div className="lg:col-span-3">
        <TerminalWindow />
      </div>
    </div>
  </section>
);

const FitSection = () => (
  <section className="px-4 py-16 max-w-7xl mx-auto">
    <div className="text-center mb-12">
      <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Where it fits</h2>
      <p className="mt-3 text-text-muted">Below ~3 features it's overkill. Above ~5 it pays for itself many times over.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-border rounded-[2rem] overflow-hidden border border-slate-border">
      <div className="bg-slate-surface p-10 md:p-14">
        <div className="inline-flex items-center gap-2 bg-vibrant-green/10 text-vibrant-green text-xs font-bold font-mono px-4 py-1.5 rounded-full border border-vibrant-green/20 mb-8 uppercase tracking-widest">
          <CheckCircle2 className="w-4 h-4" />
          Good fit
        </div>
        <ul className="space-y-5 text-text-muted">
          {[
            "Cross-module work spanning 5–60 features",
            "Format-sensitive features (golden files, wire shapes, exact exit codes)",
            "Multi-step migrations where a wrong early choice corrupts everything downstream",
            "Long-running epics where you want to walk away and resume tomorrow",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-4">
              <CheckCircle2 className="w-5 h-5 text-vibrant-green shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-slate-surface p-10 md:p-14">
        <div className="inline-flex items-center gap-2 bg-rose-500/10 text-rose-500 text-xs font-bold font-mono px-4 py-1.5 rounded-full border border-rose-500/20 mb-8 uppercase tracking-widest">
          <XCircle className="w-4 h-4" />
          Don't use it for
        </div>
        <ul className="space-y-5 text-text-muted">
          {[
            "Tiny single-PR hotfixes — just open the PR",
            "Cross-repo work — one epic, one repo (parallel epics + PRs instead)",
            "Throwaway exploration — run pi without ceremony",
            "Two humans on the same epic — no locking on .pi/epics/ yet",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-4">
              <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

const WhatsNew = () => (
  <section className="px-4 py-16 max-w-7xl mx-auto space-y-8">
    {/* v0.14.0 release banner — Phase 2 brain + steward + global overlay */}
    <div className="bg-vibrant-green/5 border border-vibrant-green/40 rounded-3xl p-6 md:p-8 relative overflow-hidden">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-vibrant-green/15 border border-vibrant-green/30 flex items-center justify-center">
            <Brain className="w-5 h-5 text-vibrant-green" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="inline-flex items-center bg-vibrant-green/15 text-vibrant-green text-xs font-bold font-mono px-3 py-1 rounded-full border border-vibrant-green/30 uppercase tracking-wider">
              v0.14.0 · phase 2 brain · global overlay · steward persona
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-2">
            The brain grows up: cross-repo memory + brain-only delegation.
          </h3>
          <p className="text-text-muted text-sm md:text-base leading-relaxed mb-3">
            Three new artifacts in <code className="text-vibrant-green font-mono text-xs">.pi/project/</code> —
            <code className="text-vibrant-green font-mono text-xs">gotchas.md</code> (G-NNN),
            <code className="text-vibrant-green font-mono text-xs">questions.md</code> (Q-NNN; resolution flips status + writes <code className="text-vibrant-green font-mono text-xs">resolves: Q-NNN</code> on the DEC),
            <code className="text-vibrant-green font-mono text-xs">modules/&lt;name&gt;.md</code> for per-module cards.
            Plus an opt-in cross-repo overlay at <code className="text-vibrant-green font-mono text-xs">~/.pi/global-memory/</code> for personal/team conventions (GC-NNN) and defaults (GD-NNN) —
            strictly additive, per-repo always wins on conflict (DEC-006).
            New <code className="text-vibrant-green font-mono text-xs">epicflow-steward</code> persona with a hard write-allowlist (<code className="text-vibrant-green font-mono text-xs">.pi/project/</code> + <code className="text-vibrant-green font-mono text-xs">~/.pi/global-memory/</code> only) for unattended multi-repo sweeps.
            Progressive-disclosure <code className="text-vibrant-green font-mono text-xs">index.md</code> &quot;Read for X&quot; routing table + soft size/age caps with manual rollover (stable ids never recycle).
            Five locked design calls in <a href={`${REPO}/blob/main/PLAN-v0.14.0.md`} className="text-vibrant-green hover:underline font-medium">PLAN-v0.14.0.md</a>.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <a href="#/blog/v0-14-end-to-end-guide" className="text-vibrant-green hover:underline font-medium">
              → v0.14 end-to-end guide (read first!)
            </a>
            <span className="text-text-muted">·</span>
            <a href={`${REPO}/blob/main/CHANGELOG.md#0140--2026-05-26`} className="text-vibrant-green hover:underline font-medium">
              v0.14.0 changelog →
            </a>
            <span className="text-text-muted">·</span>
            <a href={`${REPO}/blob/main/PLAN-v0.14.0.md`} className="text-vibrant-green hover:underline font-medium">
              v0.14 plan →
            </a>
            <span className="text-text-muted">·</span>
            <a href={`${REPO}/releases/tag/v0.14.0`} className="text-vibrant-green hover:underline font-medium">
              v0.14.0 release →
            </a>
          </div>
        </div>
      </div>
    </div>

    {/* v0.13.0 release banner — project memory pillar */}
    <div className="bg-amber-500/5 border border-amber-500/40 rounded-3xl p-6 md:p-8 relative overflow-hidden">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <Brain className="w-5 h-5 text-amber-400" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="inline-flex items-center bg-amber-500/15 text-amber-300 text-xs font-bold font-mono px-3 py-1 rounded-full border border-amber-500/30 uppercase tracking-wider">
              v0.13.0 · second pillar · project memory
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-2">
            Pi sessions stop <em>forgetting</em> across runs.
          </h3>
          <p className="text-text-muted text-sm md:text-base leading-relaxed mb-3">
            A persistent, file-based <strong>project brain</strong> at <code className="text-amber-300 font-mono text-xs">.pi/project/</code> —
            <code className="text-amber-300 font-mono text-xs">charter.md</code> ·
            <code className="text-amber-300 font-mono text-xs">conventions.md</code> ·
            <code className="text-amber-300 font-mono text-xs">decisions.md</code> ·
            <code className="text-amber-300 font-mono text-xs">backlog.md</code> ·
            <code className="text-amber-300 font-mono text-xs">sessions.md</code> ·
            <code className="text-amber-300 font-mono text-xs">index.md</code>.
            Pi reads on entry; writes <em>autonomously</em> on trigger phrases (“defer to v2” → backlog, “let's go with X over Y” → decision, “always/never” → convention) — not at session end, not via slash commands.
            Append-only with supersedes; never edits history.
            Five custom <code className="text-amber-300 font-mono text-xs">epicflow-*</code> sub-agent personas (scout, researcher, worker, reviewer, oracle) replace generic pi-subagents with mandatory <code className="text-amber-300 font-mono text-xs">.pi/project/</code> primes, bounded budgets, and strict output contracts.
            Hard anti-stub rule (<code className="text-amber-300 font-mono text-xs">C-001</code>): no <code className="text-amber-300 font-mono text-xs">TODO</code> / <code className="text-amber-300 font-mono text-xs">FIXME</code> / <code className="text-amber-300 font-mono text-xs">NotImplementedError</code> / bare-<code className="text-amber-300 font-mono text-xs">pass</code> in shipped code, enforced by the reviewer's grep gate.
            Dogfooded on this repo: the first audit caught a real pre-existing C-003 violation (<code className="text-amber-300 font-mono text-xs">pi-epic-status</code> missing its PowerShell mirror, logged as BL-007).
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <a href={`${REPO}/blob/main/CHANGELOG.md#0130--2026-05-26`} className="text-amber-300 hover:underline font-medium">
              v0.13.0 changelog →
            </a>
            <span className="text-text-muted">·</span>
            <a href={`${REPO}/blob/main/skills/project-memory/SKILL.md`} className="text-amber-300 hover:underline font-medium">
              project-memory skill →
            </a>
            <span className="text-text-muted">·</span>
            <a href={`${REPO}/blob/main/PLAN-v0.13.0.md`} className="text-amber-300 hover:underline font-medium">
              v0.13 plan →
            </a>
            <span className="text-text-muted">·</span>
            <a href={`${REPO}/releases/tag/v0.13.0`} className="text-amber-300 hover:underline font-medium">
              v0.13.0 release →
            </a>
          </div>
        </div>
      </div>
    </div>

    {/* v0.10.0 release banner — deliverables contract + second dogfood (kept for history) */}
    <div className="bg-amber-500/5 border border-amber-500/40 rounded-3xl p-6 md:p-8 relative overflow-hidden">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <Flag className="w-5 h-5 text-amber-400" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="inline-flex items-center bg-amber-500/15 text-amber-300 text-xs font-bold font-mono px-3 py-1 rounded-full border border-amber-500/30 uppercase tracking-wider">
              v0.10.1 · stress-test hotfix · parallel + E2E verified
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-2">
            Decomposition is the contract for <em>everything</em> the epic ships.
          </h3>
          <p className="text-text-muted text-sm md:text-base leading-relaxed mb-3">
            Second consecutive epic shipped by pi-epicflow on its <em>own codebase</em>. New per-feature fields in <code className="text-amber-300 font-mono text-xs">decomposition.yaml</code>: <code className="text-amber-300 font-mono text-xs">e2e_scenarios</code> · <code className="text-amber-300 font-mono text-xs">mock_fixtures</code> · <code className="text-amber-300 font-mono text-xs">docs_updates</code> · <code className="text-amber-300 font-mono text-xs">changelog_entry</code>. Validator's trigger→deliverable engine enforces them under <code className="text-amber-300 font-mono text-xs">strict_deliverables: true</code> (opt-in in v0.10, default in v0.11). <code className="text-amber-300 font-mono text-xs">pi-epic-complete</code> gains an opt-in E2E gate with H11 halt + bisect recipe. Lessons distilled: <strong>L-056</strong> (decomposition-as-contract, generalizing L-044), <strong>L-057</strong> (mocks owned by the importing feature, never gate-time), <strong>L-058 candidate</strong> (content-based SDK detection catches transitive imports). Verified end-to-end on a fresh Vite+React fixture with a planted bug unit tests miss but E2E catches. APPROVE_EPIC at the L-043 gate with 0 hard / 3 soft findings.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <a href={`${REPO}/blob/main/CHANGELOG.md#0100--2026-05-18`} className="text-amber-300 hover:underline font-medium">
              v0.10.0 changelog →
            </a>
            <span className="text-text-muted">·</span>
            <a href={`${REPO}/blob/main/.pi/epics/done/0002-deliverables-contract-v10/epic-review.md`} className="text-amber-300 hover:underline font-medium">
              Epic review →
            </a>
            <span className="text-text-muted">·</span>
            <a href={`${REPO}/blob/main/docs/v0.10-real-app-verification.md`} className="text-amber-300 hover:underline font-medium">
              Real-app verification →
            </a>
            <span className="text-text-muted">·</span>
            <a href={`${REPO}/releases/tag/v0.10.0`} className="text-amber-300 hover:underline font-medium">
              v0.10.0 release →
            </a>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-slate-surface border border-vibrant-green/30 rounded-3xl p-8 md:p-12 relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-vibrant-green/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative">
        <div className="inline-flex items-center gap-2 bg-vibrant-green/10 text-vibrant-green text-xs font-bold font-mono px-4 py-1.5 rounded-full border border-vibrant-green/20 mb-6 uppercase tracking-widest">
          <Brain className="w-3 h-3" />
          New in v0.10 (· second dogfood)
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">Parallel feature execution. One linear epic.</h2>
        <p className="text-text-muted text-base md:text-lg max-w-3xl leading-relaxed mb-8">
          v0.8 is the first concurrency feature in pi-epicflow. Opt in via{" "}
          <code className="text-vibrant-green font-mono text-xs">parallel.max_workers</code>{" "}
          and the orchestrator dispatches up to N feature workers concurrently when the DAG permits AND their declared{" "}
          <code className="text-vibrant-green font-mono text-xs">scope_files</code>{" "}
          don't overlap. The serial merge property is preserved: only one{" "}
          <code className="text-vibrant-green font-mono text-xs">pi-feature-complete</code>{" "}
          runs at a time, so the epic branch stays a linear sequence of squash commits. No filesystem locks. No IPC. Coordination lives in the orchestrator's loop variables (L-048).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container border border-slate-border rounded-2xl p-6">
            <Brain className="w-6 h-6 text-vibrant-green mb-3" />
            <h3 className="font-bold text-white mb-2">In-process merge queue (L-048)</h3>
            <p className="text-text-muted text-sm leading-relaxed">
              The orchestrator is one pi session; it owns dispatch AND merge. No{" "}
              <code className="text-vibrant-green font-mono text-xs">flock</code>, no{" "}
              <code className="text-vibrant-green font-mono text-xs">.locks/</code>{" "}
              directory, no Windows-vs-POSIX divergence. Parallel workers run in their own worktrees; only the orchestrator's FIFO ever calls{" "}
              <code className="text-vibrant-green font-mono text-xs">pi-feature-complete</code>. Single trusted writer + many subagent workers → in-process variables, not kernel primitives.
            </p>
          </div>
          <div className="bg-surface-container border border-slate-border rounded-2xl p-6">
            <Flag className="w-6 h-6 text-fuchsia-400 mb-3" />
            <h3 className="font-bold text-white mb-2">Conflict pre-check (L-049)</h3>
            <p className="text-text-muted text-sm leading-relaxed">
              <code className="text-fuchsia-400 font-mono text-xs">pi-epic-next-feature --batch N</code>{" "}
              refuses to dispatch two features whose declared{" "}
              <code className="text-fuchsia-400 font-mono text-xs">scope_files</code>{" "}
              overlap. The data was already in the decomposition. False positives serialize when they could've paralleled (low cost). False negatives reduce to an existing rule: declare scope honestly. If a worker still goes out-of-scope, the H6 halt at merge time classifies the conflict as <em>in-scope</em> (decomposition was wrong) or <em>out-of-scope</em> (worker drift) for the operator.
            </p>
          </div>
          <div className="bg-surface-container border border-slate-border rounded-2xl p-6">
            <Lightbulb className="w-6 h-6 text-amber-400 mb-3" />
            <h3 className="font-bold text-white mb-2">Opt-in, backward-compatible</h3>
            <p className="text-text-muted text-sm leading-relaxed">
              Default{" "}
              <code className="text-amber-400 font-mono text-xs">max_workers: 1</code>{" "}
              is byte-for-byte the v0.7 path. Operators opt in by editing{" "}
              <code className="text-amber-400 font-mono text-xs">epic-config.yaml</code>. v0.7's gates (feature-epic-reviewer, integration-shell validator, required_toolchain pre-flight) all apply unchanged — v0.8 adds concurrency without relaxing any safety property.
            </p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
          <a href={`${REPO}/blob/main/CHANGELOG.md`} className="text-vibrant-green hover:underline">
            Full v0.8 changelog →
          </a>
          <span className="text-text-muted">·</span>
          <a href={`${REPO}/blob/main/docs/v0.8.0-real-app-verification.md`} className="text-vibrant-green hover:underline">
            Real-app verification report →
          </a>
          <span className="text-text-muted">·</span>
          <a href={`${REPO}/blob/main/docs/sketch-parallel.md`} className="text-vibrant-green hover:underline">
            Parallel design doc →
          </a>
          <span className="text-text-muted">·</span>
          <a href={`${REPO}/blob/main/docs/recovery.md`} className="text-vibrant-green hover:underline">
            R9 recovery recipe →
          </a>
          <span className="text-text-muted">·</span>
          <a href={`${REPO}/blob/main/skills/epic-feature-workflow/lessons.md`} className="text-vibrant-green hover:underline">
            All 52 lessons →
          </a>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="border-t border-slate-border bg-slate-background/50">
    <div className="max-w-7xl mx-auto py-12 px-4 md:px-10 flex flex-col md:flex-row justify-between items-center gap-8">
      <div className="flex items-center gap-2 font-bold text-lg">
        <Terminal className="text-vibrant-green w-5 h-5" />
        <span className="text-white">pi-epicflow</span>
      </div>
      <p className="text-text-muted text-sm max-w-md text-center md:text-left">
        Open-source workflow tooling for shipping multi-feature work with AI coding agents. MIT licensed.
      </p>
      <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs font-medium text-text-muted uppercase tracking-widest">
        <a href={`${REPO}/releases`} className="hover:text-vibrant-green transition-colors">Releases</a>
        <a href="#/blog" className="hover:text-vibrant-green transition-colors">Blog</a>
        <a href={`${REPO}/blob/main/CHANGELOG.md`} className="hover:text-vibrant-green transition-colors">Changelog</a>
        <a href={`${REPO}/issues`} className="hover:text-vibrant-green transition-colors">Issues</a>
        <a href={`${REPO}/blob/main/LICENSE`} className="hover:text-vibrant-green transition-colors">License</a>
      </nav>
    </div>
  </footer>
);

export default function App() {
  const route = useHashRoute();
  return (
    <div className="min-h-screen font-sans selection:bg-vibrant-green selection:text-white">
      <Navbar />
      <main>
        {route.kind === "home" && (
          <>
            <Hero />
            <Benefits />
            <WorkflowAndQuickstart />
            <WhatsNew />
            <FitSection />
          </>
        )}
        {route.kind === "blog-index" && <BlogIndex />}
        {route.kind === "blog-post" && <PostShell slug={route.slug} />}
      </main>
      <Footer />
    </div>
  );
}
