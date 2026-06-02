#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

services=(
  api-gateway
  core-service
  flow-service
  docs-service
  ai-service
  memory-service
  discover-service
  desk-service
  pulse-service
  dev-service
  collab-service
  automation-service
  connect-service
  guard-service
  insights-service
  media-service
  event-service
)

required_items=("README.md" "Dockerfile" "requirements.txt" "tests")

for service in "${services[@]}"; do
  service_dir="${ROOT_DIR}/services/${service}"
  echo "==> ${service}"
  if [[ ! -d "${service_dir}" ]]; then
    echo "missing service directory"
    continue
  fi
  for item in "${required_items[@]}"; do
    if [[ -e "${service_dir}/${item}" ]]; then
      echo "ok ${item}"
    else
      echo "missing ${item}"
    fi
  done
done
