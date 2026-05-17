#!/usr/bin/env bash
# pi-epic-status-halts.sh — open halt-reports renderer
# Sourced by pi-epic-status dispatcher; do not execute directly.

render_halts() {
    local epic_dir="$1"

    local halts=("$epic_dir"/halt-*.md)
    if [[ -e "${halts[0]}" ]]; then
        echo "── open halt-reports ──"
        for h in "${halts[@]}"; do
            echo "  $h"
        done
    fi
}
