# Global Charter

> Optional. Your personal / team identity that carries across every
> repo. Lives at `~/.pi/global-memory/charter.md`.

**Owner:** {{OWNER_NAME}}
**Last verified:** {{DATE}}

## Who I am

<2-3 sentences. Role, team, the kind of work you typically do.>

## Quality bar I carry across repos

- <"I ship working code, not demos.">
- <"I prefer fewer dependencies over more.">
- <"I write tests for code I'd be embarrassed to land without them.">
- <"I read library docs before guessing.">

## Stack defaults (when I get to pick)

| Concern | Default |
|---|---|
| Python dep mgmt | _TBD_ |
| Python linter / formatter | _TBD_ |
| Node runtime | _TBD_ |
| Database for new services | _TBD_ |
| Cloud / hosting | _TBD_ |
| Observability | _TBD_ |
| CI | _TBD_ |

Fill in the rows that apply; leave `_TBD_` (or delete the row) for
concerns you don't have a default opinion on.

## How I work with AI agents

- <"I read every diff before commit.">
- <"I always run `/project-review` weekly across active repos.">
- <"I prefer the agent to halt over guessing.">

## When per-repo overrides this charter

When a per-repo `.pi/project/charter.md` contradicts this global
charter, the per-repo wins. The pi agent surfaces a one-line note
when that happens.
