from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.db.base import Base  # noqa: E402
from app.db.session import engine  # noqa: E402

import scripts.seed_flow_defaults as seed_flow_defaults  # noqa: E402


def main() -> None:
    os.environ.setdefault("FLOW_DEMO_WORKSPACE_ID", "1")
    os.environ.setdefault("FLOW_DEMO_PROJECT_ID", "1")
    os.environ.setdefault("FLOW_DEMO_REPORTER_ID", "1")

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_flow_defaults.WORKSPACE_ID = int(os.environ["FLOW_DEMO_WORKSPACE_ID"])
    seed_flow_defaults.PROJECT_ID = int(os.environ["FLOW_DEMO_PROJECT_ID"])
    seed_flow_defaults.REPORTER_ID = int(os.environ["FLOW_DEMO_REPORTER_ID"])
    seed_flow_defaults.main()


if __name__ == "__main__":
    main()
