# Halt: <H#> — <short reason>

**Timestamp:** YYYY-MM-DD HH:MM:SS
**Active epic:** <epic-id>
**Active feature:** F<NN>-<slug>
**Worktree:** <abs path>
**Branch:** <branch name>

## What pi tried

1. <attempt 1 + outcome>
2. <attempt 2 + outcome>
3. <attempt 3 + outcome>

## Why pi can't decide / proceed

<one or two paragraphs explaining the blocker>

## Recommended default

<pi's best guess at what the human would say, with rationale>

## Resume

After resolving:

```bash
pi-epic-run --resume                       # pick up where we left off
pi-epic-run --resume --accept-recommended  # accept the recommended default and proceed
```

If the design itself needs to change, edit `design.md` and (if needed)
`decomposition.yaml`, then resume.
