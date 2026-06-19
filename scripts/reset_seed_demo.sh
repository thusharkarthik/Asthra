#!/usr/bin/env bash
set -euo pipefail

echo "Resetting and seeding core-service..."
docker compose exec core-service python scripts/reset_seed_core_demo.py

echo "Resetting and seeding flow-service..."
docker compose exec \
  -e FLOW_DEMO_WORKSPACE_ID=1 \
  -e FLOW_DEMO_PROJECT_ID=1 \
  -e FLOW_DEMO_REPORTER_ID=1 \
  flow-service python scripts/reset_seed_flow_demo.py

echo "Demo reset complete."
echo "Login with admin@admin.com / Admin123!"
