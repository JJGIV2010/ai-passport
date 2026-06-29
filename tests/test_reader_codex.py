"""Tests for the Codex CLI session reader."""

from pathlib import Path
import pytest
from passport.reader_codex import (
    read_codex_session, aggregate_codex, _cmd_verb, _categorize_cmd
)

FIXTURE = Path(__file__).parent / "fixtures" / "sample_codex_session.jsonl"


def _session():
    m = read_codex_session(FIXTURE)
    assert m is not None, "Fixture returned None"
    return m


# ── Reader unit tests ────────────────────────────────────────────────────────

def test_read_session_returns_metrics():
    assert read_codex_session(FIXTURE) is not None


def test_session_id_from_meta():
    m = _session()
    assert m.session_id == "aaaabbbb-0000-0000-0000-000000000001"


def test_project_name_from_cwd():
    m = _session()
    assert m.project == "my-project"


def test_user_turns():
    m = _session()
    assert m.user_turns == 2  # two user_message events


def test_exec_total():
    m = _session()
    # 5 exec_command_end events in the fixture
    assert m.exec_total == 5


def test_exec_error_count():
    m = _session()
    # pytest call exits with code 1
    assert m.exec_errors == 1


def test_patch_count():
    m = _session()
    assert m.patch_count == 1


def test_files_patched():
    m = _session()
    # changes dict has 2 entries (src/main.py, src/utils.py)
    assert m.files_patched == 2


def test_token_usage_from_final_snapshot():
    m = _session()
    # Final token_count event has cumulative totals
    assert m.input_tokens == 20000
    assert m.cached_input_tokens == 15000
    assert m.output_tokens == 500
    assert m.reasoning_tokens == 50


def test_cache_efficiency():
    m = _session()
    # 15000 / (20000 + 15000) * 100 = 42.9%
    assert abs(m.cache_efficiency_pct - 42.9) < 0.5


def test_model_detected():
    m = _session()
    assert "gpt-5.4" in m.models_used


def test_reasoning_efforts():
    m = _session()
    assert "medium" in m.reasoning_efforts
    assert "high" in m.reasoning_efforts


def test_plan_mode_turns():
    m = _session()
    # turn-0002 has collaboration_mode.mode == "plan"
    assert m.plan_mode_turns == 1


def test_had_errors():
    m = _session()
    assert m.had_errors is True


def test_active_minutes_positive():
    m = _session()
    assert m.active_minutes > 0


def test_nonexistent_file_returns_none():
    assert read_codex_session(Path("no_such_file.jsonl")) is None


# ── Command categorization ───────────────────────────────────────────────────

def test_cmd_verb_powershell_wrapper():
    cmd = ["C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe", "-Command", "git status -sb"]
    assert _cmd_verb(cmd) == "git"


def test_cmd_verb_direct():
    assert _cmd_verb(["rg", "-n", "pattern"]) == "rg"


def test_cmd_verb_empty():
    assert _cmd_verb(None) == "unknown"
    assert _cmd_verb([]) == "unknown"


def test_categorize_read_commands():
    assert _categorize_cmd(["C:\\ps.exe", "-Command", "rg -n foo src/"]) == "read"
    assert _categorize_cmd(["C:\\ps.exe", "-Command", "git status -sb"]) == "read"
    assert _categorize_cmd(["C:\\ps.exe", "-Command", "git log --oneline"]) == "read"


def test_categorize_write_commands():
    assert _categorize_cmd(["C:\\ps.exe", "-Command", "git commit -m msg"]) == "write"
    assert _categorize_cmd(["C:\\ps.exe", "-Command", "npm install"]) == "write"


def test_categorize_exec_fallback():
    assert _categorize_cmd(["C:\\ps.exe", "-Command", "some-custom-tool"]) == "exec"


# ── Aggregation ──────────────────────────────────────────────────────────────

def test_aggregate_single_session():
    result = aggregate_codex([_session()])
    assert result["source"] == "codex_cli"
    assert result["session_counts"]["total"] == 1


def test_aggregate_token_totals():
    result = aggregate_codex([_session()])
    assert result["tokens"]["total_output"] == 500
    assert result["tokens"]["total_reasoning"] == 50


def test_aggregate_reasoning_pct():
    result = aggregate_codex([_session()])
    # 50/500 * 100 = 10.0%
    assert abs(result["tokens"]["reasoning_pct_of_output"] - 10.0) < 0.5


def test_aggregate_operations():
    result = aggregate_codex([_session()])
    assert result["operations"]["total_exec_commands"] == 5
    assert result["operations"]["total_file_patches"] == 1
    assert result["operations"]["total_files_patched"] == 2


def test_aggregate_plan_sessions():
    result = aggregate_codex([_session()])
    assert result["session_counts"]["plan_mode"] == 1


def test_aggregate_empty_returns_empty_dict():
    assert aggregate_codex([]) == {}


def test_aggregate_models():
    result = aggregate_codex([_session()])
    assert "gpt-5.4" in result["operational"]["models_used"]


def test_aggregate_two_sessions():
    s = _session()
    result = aggregate_codex([s, s])
    assert result["session_counts"]["total"] == 2
    assert result["operations"]["total_exec_commands"] == 10
