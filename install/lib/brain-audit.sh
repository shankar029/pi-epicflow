#!/usr/bin/env bash
# install/lib/brain-audit.sh
#
# Shared helpers for fence-aware audits of .pi/project/ brain files.
# Sourced by audit scripts and recommended for inline use by anything
# that needs to extract "real" entries from a brain file (not the
# example shapes inside ```md ... ``` fenced blocks).
#
# Functions exported:
#   brain_entries <file>        Print real `## ` heading lines (skip fenced).
#   brain_anchors <prefix> <file>   Count real anchor lines (e.g. "## BL-").
#   brain_stale_days <file> <days>  Print 1 if file mtime is older than N days.
#
# All functions print to stdout and return 0; missing-file is silent.

# Print all real `## ` headings, ignoring those inside ```fenced``` blocks.
# Output format: <filename>:<line>: ## <heading>
brain_entries() {
    local file="$1"
    [[ -f "$file" ]] || return 0
    awk '
        /^```/   { fence = !fence; next }
        /^## /   { if (!fence) print FILENAME ":" FNR ": " $0 }
    ' "$file"
}

# Count real anchor lines matching `^## <prefix>` outside fences.
# E.g. brain_anchors "BL-" .pi/project/backlog.md → "7"
brain_anchors() {
    local prefix="$1"
    local file="$2"
    [[ -f "$file" ]] || { echo 0; return 0; }
    awk -v p="^## ${prefix}" '
        /^```/        { fence = !fence; next }
        $0 ~ p        { if (!fence) n++ }
        END           { print n+0 }
    ' "$file"
}

# Print 1 if file mtime is older than <days>, else 0.
brain_stale_days() {
    local file="$1"
    local days="$2"
    [[ -f "$file" ]] || { echo 0; return 0; }
    # GNU and BSD stat differ — use find -mtime which is universal.
    if find "$file" -mtime "+${days}" -print 2>/dev/null | grep -q .; then
        echo 1
    else
        echo 0
    fi
}
