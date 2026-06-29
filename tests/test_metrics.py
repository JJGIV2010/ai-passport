"""Tests for the metrics aggregation module."""

import pytest
from passport.reader import read_session
from passport.metrics import aggregate
from pathlib import Path

FIXTURE = Path(__file__).parent / "fixtures" / "sample_session.jsonl"


def _session():
    return read_session(FIXTURE)


def test_aggregate_single_session():
    session = _session()
    assert session is not None
    result = aggregate([session])
    assert "analysis_period" in result
    assert "session_counts" in result
    assert "tool_usage" in result


def test_session_count():
    session = _session()
    result = aggregate([session])
    assert result["session_counts"]["total"] == 1
    assert result["session_counts"]["with_user_activity"] == 1


def test_date_range_days():
    session = _session()
    result = aggregate([session])
    assert result["analysis_period"]["days"] >= 1


def test_token_totals():
    session = _session()
    result = aggregate([session])
    assert result["tokens"]["total_output"] == 550  # 150+220+180
    assert result["tokens"]["total_cache_read"] == 19600  # 5000+7200+7400


def test_refactor_ratio():
    session = _session()
    result = aggregate([session])
    # 1 Edit, 0 Write from non-sidechain → ratio = 1.0/(1.0+0.0) = 1.0
    assert result["development_patterns"]["refactor_ratio_edit_vs_write"] == 1.0


def test_category_percentages_sum_to_100():
    session = _session()
    result = aggregate([session])
    total = sum(result["tool_usage"]["category_percentages"].values())
    assert abs(total - 100.0) < 0.5  # rounding tolerance


def test_empty_sessions_raises():
    with pytest.raises(ValueError):
        aggregate([])


def test_agentic_patterns():
    session = _session()
    result = aggregate([session])
    assert result["agentic_patterns"]["sessions_with_advisor_model"] == 1


def test_multiple_sessions_aggregated():
    session = _session()
    result = aggregate([session, session])  # same session twice
    assert result["session_counts"]["total"] == 2
    assert result["tokens"]["total_output"] == 550 * 2
