"""Tests for the session JSONL reader."""

from pathlib import Path
import pytest
from passport.reader import read_session, categorize_tool, TOOL_CATEGORIES

FIXTURE = Path(__file__).parent / "fixtures" / "sample_session.jsonl"


def test_read_session_returns_metrics():
    m = read_session(FIXTURE)
    assert m is not None
    assert m.session_id == "sample_session"  # derived from filename stem


def test_user_turns_excludes_sidechain():
    m = read_session(FIXTURE)
    assert m.user_turns == 3  # 3 non-sidechain user messages


def test_assistant_turns_excludes_sidechain():
    m = read_session(FIXTURE)
    assert m.assistant_turns == 3  # 3 non-sidechain assistant messages


def test_tool_uses_excludes_sidechain():
    m = read_session(FIXTURE)
    # Sidechain assistant had a Write — should NOT be counted
    # Non-sidechain: Read, Edit, Bash, Bash, Read
    assert "Read" in m.tool_uses
    assert "Edit" in m.tool_uses
    assert "Bash" in m.tool_uses
    # Write came from sidechain only
    assert m.tool_uses.get("Write", 0) == 0


def test_tool_category_counts():
    m = read_session(FIXTURE)
    assert m.tool_categories["read"] == 2   # two Read calls
    assert m.tool_categories["write"] == 1  # one Edit
    assert m.tool_categories["exec"] == 2   # two Bash


def test_tokens_aggregated():
    m = read_session(FIXTURE)
    assert m.output_tokens == 150 + 220 + 180
    assert m.cache_read_tokens == 5000 + 7200 + 7400


def test_cache_efficiency_computed():
    m = read_session(FIXTURE)
    assert 0 < m.cache_efficiency_pct <= 100


def test_advisor_model_detected():
    m = read_session(FIXTURE)
    assert m.advisor_model_invoked is True


def test_permission_mode():
    m = read_session(FIXTURE)
    assert m.permission_mode == "auto"


def test_git_branch():
    m = read_session(FIXTURE)
    assert "main" in m.git_branches


def test_debug_iteration_signal():
    m = read_session(FIXTURE)
    # Sequence: Read, Edit, Bash (exec), Bash (exec), Read → last pair exec→read = 1 signal
    assert m.debug_iteration_signals >= 1


def test_sidechain_flag():
    m = read_session(FIXTURE)
    assert m.has_sidechain_activity is True


def test_active_minutes_positive():
    m = read_session(FIXTURE)
    assert m.active_minutes > 0


def test_nonexistent_file_returns_none():
    assert read_session(Path("nonexistent_session.jsonl")) is None


def test_categorize_tool_coverage():
    assert categorize_tool("Read") == "read"
    assert categorize_tool("Edit") == "write"
    assert categorize_tool("Bash") == "exec"
    assert categorize_tool("Agent") == "agent"
    assert categorize_tool("WebSearch") == "web"
    assert categorize_tool("TaskCreate") == "plan"
    assert categorize_tool("SomeMcpTool") == "other"
