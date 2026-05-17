#!/usr/bin/env bash
# pi-epic-status-halts.sh — ⚠ HALTS renderer (unresolved halt visibility)
# Sourced by pi-epic-status dispatcher; do not execute directly.
#
# Discovery rule: a halt is unresolved if halt-*.md exists in a feature
# directory AND there is no sibling resolved-halt-*.md with matching suffix.
# E.g. halt-h6-foo.md is resolved if resolved-halt-h6-foo.md exists.

# Halt code → short description mapping
_halt_description() {
    case "$1" in
        H1)  echo "build/tests broken before feature work started" ;;
        H2)  echo "scope_files insufficient (worker discipline)" ;;
        H3)  echo "design.md ambiguous" ;;
        H4)  echo "external dependency unavailable" ;;
        H5)  echo "reviewer raised an architecture concern" ;;
        H6)  echo "out-of-scope worker drift" ;;
        H7)  echo "AC not satisfiable as written" ;;
        H8)  echo "review blocked the merge" ;;
        H9)  echo "parallel-merge conflict" ;;
        H10) echo "halt-during-parallel-batch" ;;
        *)   echo "unknown halt code" ;;
    esac
}

render_halts() {
    local epic_dir="$1"
    local features_dir="$epic_dir/features"

    [[ -d "$features_dir" ]] || return 0

    local feature_ids=()
    local halt_codes=()
    local halt_descs=()
    local halt_files=()
    local recovery_anchors=()

    local fdir
    for fdir in "$features_dir"/*/; do
        [[ -d "$fdir" ]] || continue
        local feature_id
        feature_id="$(basename "$fdir")"
        # Extract just the F-number (e.g. F04 from F04-halt-visibility)
        local fid="${feature_id%%-*}"

        local hfile
        for hfile in "$fdir"halt-*.md; do
            [[ -e "$hfile" ]] || continue
            local base
            base="$(basename "$hfile")"

            # Check for resolved sibling
            local resolved="$fdir/resolved-$base"
            [[ -e "$resolved" ]] && continue

            # Extract halt code and rest from filename: halt-h6-out-of-scope.md
            local stem="${base%.md}"          # halt-h6-out-of-scope
            local after_halt="${stem#halt-}"  # h6-out-of-scope
            local code_lower="${after_halt%%-*}"  # h6
            local rest="${after_halt#*-}"     # out-of-scope
            # Handle case where there's no rest (halt-h6.md)
            [[ "$rest" == "$after_halt" ]] && rest=""

            local halt_code
            halt_code="$(echo "$code_lower" | tr '[:lower:]' '[:upper:]')"  # H6

            local desc
            desc="$(_halt_description "$halt_code")"

            # Recovery anchor: h6 → r6
            local code_num="${code_lower#h}"  # 6
            local anchor
            if [[ -n "$rest" ]]; then
                anchor="docs/recovery.md#r${code_num}-${rest}"
            else
                anchor="docs/recovery.md#r${code_num}"
            fi

            feature_ids+=("$fid")
            halt_codes+=("$halt_code")
            halt_descs+=("$desc")
            halt_files+=("$hfile")
            recovery_anchors+=("$anchor")
        done
    done

    # No unresolved halts → no output
    [[ ${#feature_ids[@]} -eq 0 ]] && return 0

    echo "⚠ HALTS"
    echo ""
    local i
    for i in "${!feature_ids[@]}"; do
        printf "  %-6s  %-4s  %-50s\n" "${feature_ids[$i]}" "${halt_codes[$i]}" "${halt_descs[$i]}"
        printf "         file: %s\n" "${halt_files[$i]}"
        printf "         recovery: %s\n" "${recovery_anchors[$i]}"
        echo ""
    done
}
