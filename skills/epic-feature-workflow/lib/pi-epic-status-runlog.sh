#!/usr/bin/env bash
# pi-epic-status-runlog.sh — recent run-log renderer
# Sourced by pi-epic-status dispatcher; do not execute directly.

render_runlog() {
    local epic_dir="$1"

    echo "── recent run-log ──"
    if [[ -f "$epic_dir/run-log.jsonl" ]]; then
        tail -n 10 "$epic_dir/run-log.jsonl"
    else
        echo "  (empty)"
    fi
    echo
}
