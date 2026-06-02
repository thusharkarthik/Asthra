#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON_BIN="${PYTHON_BIN:-}"

if [[ -z "${PYTHON_BIN}" ]]; then
  if command -v python >/dev/null 2>&1; then
    PYTHON_BIN="python"
  else
    PYTHON_BIN="python3"
  fi
fi

run_tests_in_dir() {
  local target_dir="$1"
  if [[ -d "${target_dir}/tests" ]]; then
    echo "==> ${target_dir}"
    (cd "${target_dir}" && "${PYTHON_BIN}" -m pytest tests -q)
  fi
}

for dir in "${ROOT_DIR}"/services/*-service; do
  [[ -d "${dir}" ]] || continue
  run_tests_in_dir "${dir}"
done

for dir in "${ROOT_DIR}"/packages/*; do
  [[ -d "${dir}" ]] || continue
  run_tests_in_dir "${dir}"
done
