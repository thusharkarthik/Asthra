from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ToolDefinition:
    name: str
    description: str
    read_only: bool = True

    def execute(self, **kwargs: Any) -> dict[str, Any]:
        return {
            "tool": self.name,
            "status": "placeholder",
            "read_only": self.read_only,
            "input": kwargs,
            "result": None,
        }


class ToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, ToolDefinition] = {}
        for tool in [
            ToolDefinition("memory_search", "Search indexed workspace memory."),
            ToolDefinition("docs_lookup", "Look up documentation context."),
            ToolDefinition("flow_lookup", "Look up work management context."),
            ToolDefinition("discover_lookup", "Look up product discovery context."),
            ToolDefinition("desk_lookup", "Look up service desk context."),
        ]:
            self.register(tool)

    def register(self, tool: ToolDefinition) -> None:
        self._tools[tool.name] = tool

    def get(self, name: str) -> ToolDefinition | None:
        return self._tools.get(name)

    def list(self) -> list[ToolDefinition]:
        return list(self._tools.values())

    def execute(self, name: str, **kwargs: Any) -> dict[str, Any]:
        tool = self.get(name)
        if tool is None:
            return {"tool": name, "status": "missing", "input": kwargs, "result": None}
        return tool.execute(**kwargs)


def get_tool_registry() -> ToolRegistry:
    return ToolRegistry()
