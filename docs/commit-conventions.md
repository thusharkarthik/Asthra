# Asthra Commit Conventions

Commit messages should be concise and scoped.

## Format

```text
type(scope): summary
```

## Types

- `feat`: new feature or foundation capability
- `fix`: bug fix
- `docs`: documentation
- `test`: tests
- `chore`: tooling or maintenance
- `refactor`: code structure change without behavior change

## Examples

```text
feat(api-gateway): add selected service proxy routes
docs(architecture): add service boundary rules
test(shared-events): cover no-op event client
chore(scripts): add service structure checker
```

## Rules

- Keep commits focused.
- Avoid vague messages such as `updates`.
- Mention the service or package scope when possible.
