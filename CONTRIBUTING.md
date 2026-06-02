# Contributing to Asthra

Asthra is built in focused platform stages. Contributions should keep service boundaries clear and avoid jumping ahead of the roadmap.

## Development Rules

- Keep changes scoped to the requested service, package, or documentation area.
- Do not modify unrelated service business logic.
- Do not introduce frontend, real AI, RAG, agents, cache, or automation execution unless the task explicitly asks for it.
- Update documentation when structure, APIs, or standards change.
- Keep shared packages generic and free of business logic.

## Branches

Use focused branches:

```text
feature/<area>
fix/<area>
docs/<area>
```

## Tests Before Merge

Run relevant tests before opening a PR:

```bash
python3 -m pytest tests -q
```

For repository-wide discovery:

```bash
scripts/run_all_tests.sh
```

## Pull Requests

PRs should include:

- summary of changes
- files or services affected
- tests run
- known limitations or follow-up work

## Architecture

Review these docs before larger changes:

- `docs/architecture-principles.md`
- `docs/service-boundaries.md`
- `docs/data-ownership.md`
- `docs/api-conventions.md`
