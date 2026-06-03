from app.tools import get_tool_registry


def test_tool_registry_lists_read_only_tools():
    registry = get_tool_registry()
    names = {tool.name for tool in registry.list()}

    assert {"memory_search", "docs_lookup", "flow_lookup", "discover_lookup", "desk_lookup"} <= names
    assert all(tool.read_only for tool in registry.list())


def test_tool_registry_placeholder_execution():
    result = get_tool_registry().execute("memory_search", workspace_id=1, query="status")

    assert result["status"] == "placeholder"
    assert result["read_only"] is True
    assert result["input"]["workspace_id"] == 1
