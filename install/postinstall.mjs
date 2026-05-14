#!/usr/bin/env node
/**
 * pi-epicflow postinstall
 *
 * Runs after `pi install npm:pi-epicflow` or `pi install git:...pi-epicflow`.
 *
 * Three side-effects:
 *
 *   1. Copies the three helper agents (feature-worker, feature-reviewer,
 *      feature-planner) to ~/.pi/agent/agents/ so that pi-subagents can
 *      find them. Pi-packages have no native "agents" resource type and
 *      pi-subagents only scans user/project agent dirs, so a postinstall
 *      copy is the cleanest path.
 *
 *   2. Symlinks each pi-* CLI script from
 *      skills/epic-feature-workflow/scripts/  into
 *      ~/.local/bin/  (created if missing) so users can call
 *      `pi-epic-init`, `pi-feature-start`, etc. from any shell.
 *
 *   3. Auto-installs the two pi packages that auto-mode (/epic-run-auto)
 *      depends on so users don't hit a mid-run "subagent tool not found"
 *      and have to bounce their pi session:
 *        - npm:pi-subagents (required for auto mode)
 *        - npm:pi-intercom  (optional; nicer in-chat prompts)
 *      Scope (global vs project-local) is inferred from PKG_ROOT and the
 *      install is delegated to `pi install [-l] npm:<dep>` so settings.json
 *      and the npm tree stay in sync with pi's own bookkeeping. Skipped
 *      cleanly if already in settings or if `pi` isn't on PATH.
 *
 * All steps are defensive:
 *   - Never overwrites a file the user has customized; writes a `.new`
 *     sibling instead and prints a warning.
 *   - Never throws (the script ends with `|| true` in package.json too, so
 *     a broken postinstall doesn't break `pi install`).
 *   - Idempotent — running it twice in a row is a no-op.
 *
 * Override the install destinations via env vars:
 *   PI_EPICFLOW_AGENTS_DIR (default: ~/.pi/agent/agents)
 *   PI_EPICFLOW_BIN_DIR    (default: ~/.local/bin)
 *
 * Skip the whole thing with:
 *   PI_EPICFLOW_SKIP_POSTINSTALL=1
 *
 * Skip only the auto-install of pi-subagents/pi-intercom with:
 *   PI_EPICFLOW_NO_AUTOINSTALL_DEPS=1
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(HERE, "..");

const AGENTS_SRC = path.join(PKG_ROOT, "agents");
const SCRIPTS_SRC = path.join(PKG_ROOT, "skills", "epic-feature-workflow", "scripts");

const AGENTS_DST = process.env.PI_EPICFLOW_AGENTS_DIR
  || path.join(os.homedir(), ".pi", "agent", "agents");
const BIN_DST = process.env.PI_EPICFLOW_BIN_DIR
  || path.join(os.homedir(), ".local", "bin");

const out = (m) => process.stdout.write(`[pi-epicflow] ${m}\n`);
const warn = (m) => process.stderr.write(`[pi-epicflow] WARN: ${m}\n`);

if (process.env.PI_EPICFLOW_SKIP_POSTINSTALL === "1") {
  out("PI_EPICFLOW_SKIP_POSTINSTALL=1 — skipping all install steps.");
  process.exit(0);
}

function safeRead(file) {
  try { return fs.readFileSync(file); } catch { return null; }
}

function ensureDir(d) {
  try { fs.mkdirSync(d, { recursive: true }); return true; }
  catch (e) { warn(`could not create ${d}: ${e.message}`); return false; }
}

function copyAgentSafely(src, dstDir) {
  const name = path.basename(src);
  const dst = path.join(dstDir, name);
  const srcBuf = safeRead(src);
  if (!srcBuf) { warn(`source agent missing: ${src}`); return; }

  const existing = safeRead(dst);
  if (!existing) {
    fs.writeFileSync(dst, srcBuf);
    out(`installed agent: ${dst}`);
    return;
  }
  if (Buffer.compare(existing, srcBuf) === 0) {
    out(`agent already up to date: ${dst}`);
    return;
  }
  // Existing differs — don't clobber. Stage a .new sibling so the user can diff.
  const stash = dst + ".new";
  fs.writeFileSync(stash, srcBuf);
  warn(`existing ${name} differs from packaged version — packaged copy written to ${stash}`);
  warn(`  run: diff "${dst}" "${stash}"   to inspect, then mv if desired.`);
}

function symlinkScriptSafely(src, binDir) {
  const name = path.basename(src);
  const dst = path.join(binDir, name);
  try {
    // chmod +x on the source — npm should preserve it, but belt and suspenders
    try { fs.chmodSync(src, 0o755); } catch {}
    const existing = fs.lstatSync(dst, { throwIfNoEntry: false });
    if (existing) {
      if (existing.isSymbolicLink()) {
        const cur = fs.readlinkSync(dst);
        if (cur === src) { return; } // already correct
        // Pointing somewhere else — replace (it's our own previous version)
        if (/pi-epicflow|epic-feature-workflow/.test(cur)) {
          fs.unlinkSync(dst);
        } else {
          warn(`${dst} is a symlink to ${cur} (not us). Skipping.`);
          return;
        }
      } else {
        warn(`${dst} exists and is not a symlink. Skipping — remove it manually if you want pi-epicflow to manage it.`);
        return;
      }
    }
    fs.symlinkSync(src, dst);
    out(`linked: ${dst} -> ${src}`);
  } catch (e) {
    warn(`could not link ${name} into ${binDir}: ${e.message}`);
  }
}

// ── Step 1: agents ─────────────────────────────────────────────────────────
out(`installing agents to ${AGENTS_DST}`);
if (ensureDir(AGENTS_DST)) {
  for (const f of ["feature-worker.md", "feature-reviewer.md", "feature-planner.md"]) {
    copyAgentSafely(path.join(AGENTS_SRC, f), AGENTS_DST);
  }
}

// ── Step 2: bin symlinks ───────────────────────────────────────────────────
out(`linking pi-* scripts into ${BIN_DST}`);
if (ensureDir(BIN_DST)) {
  let entries = [];
  try { entries = fs.readdirSync(SCRIPTS_SRC); }
  catch (e) { warn(`could not read ${SCRIPTS_SRC}: ${e.message}`); }
  const cliScripts = entries.filter(n => n.startsWith("pi-"));
  if (cliScripts.length === 0) {
    warn(`no pi-* scripts found under ${SCRIPTS_SRC}`);
  }
  for (const n of cliScripts) {
    symlinkScriptSafely(path.join(SCRIPTS_SRC, n), BIN_DST);
  }

  // PATH hint
  const pathSep = process.platform === "win32" ? ";" : ":";
  const onPath = (process.env.PATH || "").split(pathSep).some(p => path.resolve(p) === path.resolve(BIN_DST));
  if (!onPath) {
    out(`note: ${BIN_DST} does not appear to be on your PATH.`);
    out(`      add to your shell profile:  export PATH="${BIN_DST}:$PATH"`);
  }
}

// ── Step 3: ensure pi-subagents + pi-intercom installed ──────────────────
const REQUIRED_DEPS = [
  { name: "pi-subagents", required: true,  why: "auto-mode orchestrator (/epic-run-auto)" },
  { name: "pi-intercom",  required: false, why: "nicer in-chat prompts (optional)" },
];

function detectScope() {
  const home = os.homedir();
  const globalRoot = path.join(home, ".pi", "agent");
  if (PKG_ROOT === globalRoot || PKG_ROOT.startsWith(globalRoot + path.sep)) {
    return {
      scope: "global",
      settings: path.join(globalRoot, "settings.json"),
      cwd: process.cwd(),
    };
  }
  // project-local installs land under <repo>/.pi/{git,npm}/...
  const sep = path.sep === "\\" ? "\\\\" : path.sep;
  const re = new RegExp(`^(.+?)${sep}\\.pi${sep}(?:git|npm)${sep}`);
  const m = PKG_ROOT.match(re);
  if (m) {
    const repoRoot = m[1];
    return {
      scope: "project",
      settings: path.join(repoRoot, ".pi", "settings.json"),
      cwd: repoRoot,
    };
  }
  return { scope: "unknown", settings: null, cwd: process.cwd() };
}

function alreadyInSettings(settingsFile, name) {
  if (!settingsFile) return false;
  try {
    const s = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
    const list = Array.isArray(s.packages) ? s.packages : [];
    return list.some((p) => {
      const src = typeof p === "string" ? p : (p && p.source);
      if (typeof src !== "string") return false;
      return src === `npm:${name}` || src.startsWith(`npm:${name}@`);
    });
  } catch {
    return false;
  }
}

function findPiBin() {
  if (process.env.PI_BIN) {
    try { fs.accessSync(process.env.PI_BIN, fs.constants.X_OK); return process.env.PI_BIN; }
    catch {}
  }
  const r = spawnSync("sh", ["-c", "command -v pi"], { encoding: "utf8" });
  if (r.status === 0 && r.stdout && r.stdout.trim()) return r.stdout.trim();
  return null;
}

function ensureDep(piBin, scope, dep) {
  if (alreadyInSettings(scope.settings, dep.name)) {
    out(`${dep.name} already in ${scope.scope} settings — skipping.`);
    return true;
  }
  const args = ["install"];
  if (scope.scope === "project") args.push("-l");
  args.push(`npm:${dep.name}`);
  out(`installing ${dep.name} (${scope.scope}): ${piBin} ${args.join(" ")}`);
  const r = spawnSync(piBin, args, {
    cwd: scope.cwd,
    stdio: "inherit",
    timeout: 180_000,
  });
  if (r.status !== 0) {
    const msg = `failed to install ${dep.name} (exit ${r.status ?? "?"}). Install manually:`;
    const cmd = `  pi install ${scope.scope === "project" ? "-l " : ""}npm:${dep.name}`;
    if (dep.required) { warn(msg); warn(cmd); }
    else              { out(msg);  out(cmd); }
    return false;
  }
  out(`installed ${dep.name}.`);
  return true;
}

if (process.env.PI_EPICFLOW_NO_AUTOINSTALL_DEPS === "1") {
  out("PI_EPICFLOW_NO_AUTOINSTALL_DEPS=1 — skipping pi-subagents/pi-intercom auto-install.");
} else {
  const scope = detectScope();
  if (scope.scope === "unknown") {
    warn(`could not detect install scope from PKG_ROOT=${PKG_ROOT}.`);
    warn(`  install pi-subagents manually:  pi install npm:pi-subagents npm:pi-intercom`);
  } else {
    const piBin = findPiBin();
    if (!piBin) {
      warn("could not locate 'pi' on PATH — skipping pi-subagents/pi-intercom auto-install.");
      warn("  set PI_BIN=/path/to/pi and re-run `pi update git:github.com/shankar029/pi-epicflow`,");
      warn("  or install manually:  pi install npm:pi-subagents npm:pi-intercom");
    } else {
      out(`ensuring pi-subagents + pi-intercom (${scope.scope} scope${scope.cwd ? `, cwd=${scope.cwd}` : ""})`);
      for (const dep of REQUIRED_DEPS) ensureDep(piBin, scope, dep);
    }
  }
}

out("done.");
