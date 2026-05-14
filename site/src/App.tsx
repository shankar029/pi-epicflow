/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { 
  Terminal, 
  Github, 
  BookOpen, 
  Layers, 
  GitBranch, 
  FileCode, 
  CheckCircle2, 
  XCircle, 
  Flag,
  ArrowRight,
  Code,
  Copy
} from "lucide-react";

const Navbar = () => (
  <header className="bg-surface/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-border">
    <div className="flex justify-between items-center w-full px-4 md:px-10 max-w-7xl mx-auto h-16">
      <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
        <Terminal className="text-vibrant-green w-6 h-6" />
        <span className="text-white">Pi-EpicFlow</span>
      </div>
      <nav className="hidden md:flex gap-8 items-center text-sm font-medium">
        <a href="https://github.com/shankar029/pi-epicflow" className="text-text-muted hover:text-vibrant-green transition-colors">GitHub</a>
        <a href="https://github.com/shankar029/pi-epicflow#readme" className="text-text-muted hover:text-vibrant-green transition-colors">Documentation</a>
      </nav>
      <div>
        <a href="https://github.com/shankar029/pi-epicflow#install" className="inline-block bg-vibrant-green hover:bg-vibrant-green-hover text-surface px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-[0_0_20px_rgba(34,197,94,0.15)]">
          Install
        </a>
      </div>
    </div>
  </header>
);

const Hero = () => (
  <section className="px-4 py-20 md:py-32 max-w-7xl mx-auto text-center relative">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-vibrant-green/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
    
    <motion.h1 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-4xl md:text-6xl font-black text-white mb-6 max-w-4xl mx-auto leading-tight"
    >
      Ship multi-feature work as one <span className="text-vibrant-green">clean PR</span>
    </motion.h1>
    
    <motion.p 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="text-lg md:text-xl text-text-muted mb-10 max-w-2xl mx-auto leading-relaxed"
    >
      Manage complex development workflows via a DAG of small, manageable features. Isolate work, automate contexts, and maintain a clean git history.
    </motion.p>
    
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="flex flex-col sm:flex-row items-center justify-center gap-4"
    >
      <a href="https://github.com/shankar029/pi-epicflow#install" className="w-full sm:w-auto bg-vibrant-green hover:bg-vibrant-green-hover text-surface px-10 py-4 rounded-xl font-bold uppercase tracking-wider transition-colors text-center">
        Get Started
      </a>
      <a href="https://github.com/shankar029/pi-epicflow" className="w-full sm:w-auto bg-slate-surface border border-slate-border text-white px-10 py-4 rounded-xl font-bold uppercase tracking-wider hover:border-vibrant-green/50 hover:bg-surface-container transition-all flex items-center justify-center gap-2">
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <BenefitCard 
        icon={GitBranch}
        title="Fresh Contexts"
        description="Every feature gets its own branch and worktree. Never pollute your workspace when switching tasks."
        delay={0.1}
      />
      <BenefitCard 
        icon={Layers}
        title="Isolated Worktrees"
        description="Work on multiple features simultaneously without the endless stash/pop cycles."
        delay={0.2}
        colorClass="text-cyan-400"
      />
      <BenefitCard 
        icon={FileCode}
        title="YAML-driven"
        description="Decompose complex work using a simple epic.yaml file. Declarative workflow management."
        delay={0.3}
        colorClass="text-emerald-400"
      />
    </div>
  </section>
);

const DAGVisualization = () => (
  <div className="bg-slate-surface border border-slate-border rounded-3xl p-8 relative overflow-hidden flex items-center justify-center min-h-[400px]">
    <div className="relative w-full max-w-sm flex flex-col items-center">
      {/* Root Node */}
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-16 h-16 rounded-full bg-vibrant-green/20 border-2 border-vibrant-green flex items-center justify-center z-10 shadow-[0_0_30px_rgba(34,197,94,0.3)]"
      >
        <Flag className="text-vibrant-green w-8 h-8 fill-vibrant-green/20" />
      </motion.div>

      {/* Connection Lines */}
      <div className="h-16 w-px bg-slate-border my-2 relative">
        <motion.div 
          initial={{ height: 0 }}
          whileInView={{ height: "100%" }}
          transition={{ delay: 0.3 }}
          className="absolute inset-0 bg-vibrant-green w-px" 
        />
      </div>

      <div className="flex gap-16 md:gap-24 relative">
        {/* Horizontal Line */}
        <motion.div 
          initial={{ width: 0 }}
          whileInView={{ width: "100%" }}
          transition={{ delay: 0.4 }}
          className="absolute top-0 left-0 right-0 h-px bg-slate-border" 
        />

        <div className="flex flex-col items-center">
          <div className="h-8 w-px bg-slate-border" />
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="w-16 h-12 rounded-2xl bg-surface-container border border-slate-border flex items-center justify-center text-[10px] font-mono text-text-muted"
          >
            feat-1
          </motion.div>
          
          <div className="h-8 w-px bg-slate-border mt-2" />
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="w-16 h-12 rounded-2xl bg-surface-container border border-slate-border flex items-center justify-center text-[10px] font-mono text-text-muted"
          >
            fix-a
          </motion.div>
        </div>

        <div className="flex flex-col items-center">
          <div className="h-8 w-px bg-slate-border" />
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="w-16 h-12 rounded-2xl bg-surface-container border border-slate-border flex items-center justify-center text-[10px] font-mono text-text-muted"
          >
            feat-2
          </motion.div>
        </div>
      </div>

      <div className="mt-12 text-center text-xs font-mono text-text-muted uppercase tracking-[0.2em]">
        Directed Acyclic Graph (DAG) Structure
      </div>
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
    <div className="p-6 font-mono text-sm leading-relaxed relative">
      <button className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors">
        <Copy className="w-4 h-4" />
      </button>
      <div className="space-y-2">
        <div className="flex gap-3">
          <span className="text-slate-border select-none">$</span>
          <span className="text-white"><span className="text-vibrant-green">pip</span> install pi-epicflow</span>
        </div>
        <div className="flex gap-3">
          <span className="text-slate-border select-none">$</span>
          <span className="text-white"><span className="text-vibrant-green">pi</span> epic init <span className="text-cyan-400">--name</span> my-feature</span>
        </div>
        <div className="flex gap-3 opacity-50 pt-2">
          <span className="text-slate-border select-none">#</span>
          <span className="italic text-text-muted">Initialized empty Epic workflow in ./epic.yaml</span>
        </div>
        <div className="flex gap-3">
          <span className="text-slate-border select-none">$</span>
          <span className="text-white"><span className="text-vibrant-green">pi</span> epic start</span>
        </div>
      </div>
    </div>
  </div>
);

const WorkflowAndQuickstart = () => (
  <section className="px-4 py-16 max-w-7xl mx-auto">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div>
        <h2 className="text-3xl font-bold text-white mb-8 tracking-tight">How it Works</h2>
        <DAGVisualization />
      </div>
      <div>
        <h2 className="text-3xl font-bold text-white mb-8 tracking-tight">Quick Start</h2>
        <TerminalWindow />
      </div>
    </div>
  </section>
);

const FitSection = () => (
  <section className="px-4 py-16 max-w-7xl mx-auto">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-border rounded-[2rem] overflow-hidden border border-slate-border">
      <div className="bg-slate-surface p-10 md:p-14">
        <div className="inline-flex items-center gap-2 bg-vibrant-green/10 text-vibrant-green text-xs font-bold font-mono px-4 py-1.5 rounded-full border border-vibrant-green/20 mb-8 uppercase tracking-widest">
          <CheckCircle2 className="w-4 h-4" />
          Good Fit
        </div>
        <ul className="space-y-5 text-text-muted">
          {[
            "Complex, multi-layered feature development",
            "Long-running epics spanning weeks",
            "Team collaboration on intertwined tasks"
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
            "Tiny, single-file hotfixes",
            "Single-branch simple tasks",
            "Trivial documentation updates"
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

const Footer = () => (
  <footer className="border-t border-slate-border bg-slate-background/50">
    <div className="max-w-7xl mx-auto py-12 px-4 md:px-10 flex flex-col md:flex-row justify-between items-center gap-8">
      <div className="flex items-center gap-2 font-bold text-lg">
        <Terminal className="text-vibrant-green w-5 h-5" />
        <span className="text-white">Pi-EpicFlow</span>
      </div>
      <p className="text-text-muted text-sm max-w-sm text-center md:text-left">
        © 2024 Pi-EpicFlow. Built for high-performance developer workflows.
      </p>
      <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs font-medium text-text-muted uppercase tracking-widest">
        <a href="https://github.com/shankar029/pi-epicflow/releases" className="hover:text-vibrant-green transition-colors">Releases</a>
        <a href="https://github.com/shankar029/pi-epicflow/blob/main/CHANGELOG.md" className="hover:text-vibrant-green transition-colors">Changelog</a>
        <a href="https://github.com/shankar029/pi-epicflow/issues" className="hover:text-vibrant-green transition-colors">Issues</a>
        <a href="https://github.com/shankar029/pi-epicflow/blob/main/LICENSE" className="hover:text-vibrant-green transition-colors">License</a>
      </nav>
    </div>
  </footer>
);

export default function App() {
  return (
    <div className="min-h-screen font-sans selection:bg-vibrant-green selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <Benefits />
        <WorkflowAndQuickstart />
        <FitSection />
      </main>
      <Footer />
    </div>
  );
}
