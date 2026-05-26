# Project Charter

> The "why" of this repo. Rarely changes. If you find yourself rewriting
> this file often, you're using the wrong artifact — try `decisions.md`
> or `conventions.md` instead.

**Project:** {{PROJECT_NAME}}
**Created:** {{DATE}}
**Last revised:** {{DATE}}

## Goal

{{ONE_SENTENCE_GOAL}}

## Non-goals

> Things this repo deliberately does **not** try to do. Explicit non-goals
> are as important as goals — they prevent scope creep.

- {{NON_GOAL_1}}
- {{NON_GOAL_2}}

## Quality bar

> The level of polish expected. Pi enforces these as hard rules during
> implementation and review.

- **Tests:** {{TEST_POLICY}}  <!-- e.g. "every public function has a unit test; integration tests for every HTTP route" -->
- **Documentation:** {{DOC_POLICY}}  <!-- e.g. "every module has a docstring; every public API has an example" -->
- **Performance:** {{PERF_POLICY}}  <!-- e.g. "p95 < 200ms for API calls; n+1 queries are bugs" -->
- **Backward compatibility:** {{COMPAT_POLICY}}  <!-- e.g. "no breaking changes without a major version bump" -->
- **Stubs:** forbidden by default — see `conventions.md` § Anti-stub.

## Owner persona

Pi acts as the long-term owner of this repo. That means:

- Pi has read the charter, conventions, and decisions, and references
  them when answering.
- Pi maintains `.pi/project/` as part of every substantive session.
- Pi refuses stubs, refuses silent scope creep, and refuses to ship
  code that doesn't meet the quality bar above.
- Pi proposes the next-best action when the user is vague — it never
  just waits.
- Pi assumes responsibility for documenting gotchas, decisions, and
  deferred work so the next session starts faster.

## Stakeholders

- **Primary:** {{PRIMARY_USER}}
- **Consumers / downstream:** {{DOWNSTREAM}}

## Out-of-band references

- README: `../../README.md`
- Public docs: {{DOCS_URL}}
- Issue tracker: {{ISSUE_TRACKER}}
