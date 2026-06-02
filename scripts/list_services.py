#!/usr/bin/env python3
from pathlib import Path


SERVICES = [
    ("api-gateway", "Asthra API Gateway", 8080),
    ("core-service", "Asthra Core", 8000),
    ("flow-service", "Asthra Flow", 8001),
    ("docs-service", "Asthra Docs", 8002),
    ("ai-service", "Asthra Intelligence", 8003),
    ("memory-service", "Asthra Memory", 8004),
    ("discover-service", "Asthra Discover", 8005),
    ("desk-service", "Asthra Desk", 8006),
    ("pulse-service", "Asthra Pulse", 8007),
    ("dev-service", "Asthra Dev", 8008),
    ("collab-service", "Asthra Collab", 8009),
    ("automation-service", "Asthra Automate", 8010),
    ("connect-service", "Asthra Connect", 8011),
    ("guard-service", "Asthra Guard", 8012),
    ("insights-service", "Asthra Insights", 8013),
    ("media-service", "Asthra Media", 8014),
    ("event-service", "Asthra Event Bus", 8015),
]


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    print("Service,Suite,Port,Exists")
    for service, suite, port in SERVICES:
        exists = (root / "services" / service).is_dir()
        print(f"{service},{suite},{port},{str(exists).lower()}")


if __name__ == "__main__":
    main()
