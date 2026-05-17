#!/usr/bin/env bash
# pi-epic-status-ready.sh — --ready mode renderer
# Sourced by pi-epic-status dispatcher; do not execute directly.

render_ready() {
    local epic_dir="$1" quiet="$2"
    python3 - "$epic_dir/decomposition.yaml" "$epic_dir/features" "$quiet" <<'PY'
import sys, os, re
decomp_path, feats_dir, quiet_arg = sys.argv[1], sys.argv[2], sys.argv[3]
quiet = quiet_arg == "1"
done_dir = os.path.join(feats_dir, 'done')

def parse(p):
    out=[]; cur=None; cur_list=None
    with open(p, encoding='utf-8') as f:
        for raw in f:
            s=raw.rstrip('\n').strip()
            if not s or s.startswith('#'): continue
            if s.startswith('- ') and 'id:' in s:
                cur={}
                m=re.match(r'^id\s*:\s*(.*)$', s[2:])
                if m: cur['id']=m.group(1).strip().strip('"').strip("'")
                out.append(cur); cur_list=None; continue
            if cur is None: continue
            if s.startswith('- '):
                if cur_list is not None: cur_list.append(s[2:].strip().strip('"').strip("'"))
                continue
            m=re.match(r'^([A-Za-z0-9_]+)\s*:\s*(.*)$', s)
            if not m: continue
            k=m.group(1); v=re.sub(r'\s+#.*$','',m.group(2).strip()).strip()
            if v=='': cur[k]=[]; cur_list=cur[k]
            elif v.startswith('[') and v.endswith(']'):
                inner=v[1:-1].strip()
                cur[k]=[x.strip().strip('"').strip("'") for x in inner.split(',')] if inner else []
                cur_list=None
            else: cur[k]=v.strip('"').strip("'"); cur_list=None
    return out

def state_of(fid):
    # archived under done/ → always 'merged' regardless of meta value
    if os.path.isdir(done_dir):
        for sub in os.listdir(done_dir):
            if sub.startswith(fid):
                return 'merged'
    if os.path.isdir(feats_dir):
        for sub in os.listdir(feats_dir):
            if sub == 'done': continue
            if sub.startswith(fid):
                meta=os.path.join(feats_dir, sub, 'meta.yaml')
                if os.path.isfile(meta):
                    with open(meta) as f:
                        for line in f:
                            m=re.match(r'^state\s*:\s*(\S+)', line.strip())
                            if m: return m.group(1).strip().strip('"').strip("'")
    return 'pending'

features = parse(decomp_path)
state_map = {ft['id']: state_of(ft['id']) for ft in features if 'id' in ft}

# A dep is "satisfied" iff merged.
DEP_OK = {'merged'}
# A feature is itself dispatchable iff:
#   - own state is pending OR halted-ambiguous (the v0.6 soft-halt state)
#   - every dep is in DEP_OK
DISPATCHABLE = {'pending', 'halted-ambiguous'}

ready = []
for ft in features:
    fid = ft.get('id')
    if not fid: continue
    st = state_map.get(fid, 'pending')
    if st not in DISPATCHABLE: continue
    deps = ft.get('depends_on') or []
    if all(state_map.get(d, 'pending') in DEP_OK for d in deps):
        ready.append(ft)

if quiet:
    for ft in ready:
        print(ft['id'])
else:
    if not ready:
        print("No features are currently ready to dispatch.")
        # Hint at why: are we waiting on a single bottleneck dep?
        pending = [ft for ft in features if state_map.get(ft['id'],'pending') in DISPATCHABLE]
        if pending:
            blockers = {}
            for ft in pending:
                for d in (ft.get('depends_on') or []):
                    if state_map.get(d,'pending') not in DEP_OK:
                        blockers[d] = blockers.get(d,0) + 1
            if blockers:
                top = sorted(blockers.items(), key=lambda x:-x[1])[:3]
                print("Bottleneck deps (blocking the most pending features):")
                for d, n in top:
                    print(f"  {d}  [{state_map.get(d,'pending')}]  blocks {n} feature(s)")
    else:
        print(f"Ready to dispatch ({len(ready)} feature(s)):")
        print()
        print("  Pick any ONE id per pi session. Worktrees are already")
        print("  isolated; the merge order is decided at squash-merge time.")
        print("  If two ready features touch overlapping files, dispatch")
        print("  them serially — the dispatcher does not yet resolve")
        print("  cross-feature merge conflicts (see docs/sketch-parallel.md).")
        print()
        for ft in ready:
            fid = ft['id']
            st = state_map.get(fid,'pending')
            deps = ','.join(ft.get('depends_on') or []) or '-'
            hrs = ft.get('estimated_hours','?')
            tag = '' if st == 'pending' else f' (resuming from {st})'
            print(f"  {fid}  deps:{deps:10}  ~{hrs}h  {ft.get('summary','')}{tag}")
PY
}
