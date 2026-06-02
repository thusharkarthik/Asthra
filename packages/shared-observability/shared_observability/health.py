def service_health(service: str, status: str = "ok", details: dict | None = None) -> dict:
    return {"service": service, "status": status, "details": details or {}}


def aggregate_health(results: list[dict]) -> dict:
    overall_status = "ok" if all(result.get("status") == "ok" for result in results) else "degraded"
    return {"status": overall_status, "services": results}
