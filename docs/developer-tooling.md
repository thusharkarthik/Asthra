# Asthra Developer Tooling

Asthra includes lightweight scripts for local development checks.

## Scripts

### `scripts/run_all_tests.sh`

Runs `python -m pytest tests -q` in each service and package with a `tests/` directory.

```bash
scripts/run_all_tests.sh
```

### `scripts/check_services.sh`

Checks known service folders for expected foundation files:

- `README.md`
- `Dockerfile`
- `requirements.txt`
- `tests/`

```bash
scripts/check_services.sh
```

### `scripts/list_services.py`

Prints the known Asthra service map as CSV:

```bash
python3 scripts/list_services.py
```

## Tooling Standards

- Scripts should be safe to run locally.
- Scripts should not require production credentials.
- Scripts should not mutate service business data.
- Scripts should fail clearly when a required local dependency is missing.
- Scripts should remain lightweight and easy to inspect.

## Future Tooling

Later developer tooling may include:

- focused smoke tests
- service health dashboards
- dependency graph output
- documentation coverage checks
- API schema export checks
