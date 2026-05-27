class BaseConnector:
    provider = "generic"

    def health_check(self) -> dict:
        return {"provider": self.provider, "status": "placeholder"}

    def sync(self) -> dict:
        # TODO: Real external integration sync belongs to a later tier.
        return {"provider": self.provider, "status": "not_implemented"}
