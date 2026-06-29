"""
Aggregate a list of SessionMetrics into profile-level behavioral signals.
All outputs are counts, ratios, or percentages — no content strings.
"""

from __future__ import annotations
from collections import Counter
from datetime import datetime, timezone
from typing import Any

from .reader import SessionMetrics


def aggregate(sessions: list[SessionMetrics]) -> dict[str, Any]:
    """Return the full profile_metrics dict from a list of sessions."""
    if not sessions:
        raise ValueError("No sessions to aggregate.")

    # ── Date range ──────────────────────────────────────────────────────────
    min_dt = min(s.start_time for s in sessions)
    max_dt = max(s.end_time for s in sessions)
    date_range_days = (max_dt - min_dt).days + 1

    # ── Session counts ───────────────────────────────────────────────────────
    total = len(sessions)
    with_activity = sum(1 for s in sessions if s.user_turns > 0)

    # ── Duration ────────────────────────────────────────────────────────────
    durations = [s.active_minutes for s in sessions if s.active_minutes > 0]
    avg_duration = round(sum(durations) / len(durations), 1) if durations else 0.0

    peak_counts = Counter(s.peak_time for s in sessions)
    dominant_peak = peak_counts.most_common(1)[0][0]

    # ── Tokens ──────────────────────────────────────────────────────────────
    total_output  = sum(s.output_tokens for s in sessions)
    total_input   = sum(s.input_tokens for s in sessions)
    total_cache_r = sum(s.cache_read_tokens for s in sessions)
    avg_cache_eff = round(sum(s.cache_efficiency_pct for s in sessions) / total, 1)

    # ── Tools ───────────────────────────────────────────────────────────────
    all_tools: dict[str, int] = {}
    all_cats:  dict[str, int] = {}
    for s in sessions:
        for t, c in s.tool_uses.items():
            all_tools[t] = all_tools.get(t, 0) + c
        for cat, c in s.tool_categories.items():
            all_cats[cat] = all_cats.get(cat, 0) + c

    total_invocations = sum(all_tools.values())
    top_tools = sorted(all_tools.items(), key=lambda x: x[1], reverse=True)[:15]

    cat_pcts: dict[str, float] = {}
    if total_invocations:
        cat_pcts = {
            cat: round(c / total_invocations * 100, 1)
            for cat, c in all_cats.items()
        }

    # ── Write/read ratio ────────────────────────────────────────────────────
    total_writes = all_cats.get("write", 0)
    total_reads  = all_cats.get("read", 0)
    wr_ratio = round(total_writes / total_reads, 2) if total_reads else 0.0

    # ── Agentic patterns ────────────────────────────────────────────────────
    total_workflows    = sum(s.workflow_count for s in sessions)
    advisor_sessions   = sum(1 for s in sessions if s.advisor_model_invoked)
    agent_sessions     = sum(1 for s in sessions if s.tool_categories.get("agent", 0) > 0)
    sidechain_sessions = sum(1 for s in sessions if s.has_sidechain_activity)

    # ── Development patterns ─────────────────────────────────────────────────
    edit_count  = all_tools.get("Edit", 0)
    write_count = all_tools.get("Write", 0)
    refactor_ratio = (
        round(edit_count / (edit_count + write_count), 2)
        if (edit_count + write_count) else 0.0
    )

    avg_turns   = round(sum(s.user_turns for s in sessions) / total, 1)
    debug_rate  = round(sum(s.debug_iteration_signals for s in sessions) / total, 2)

    # ── Operational ─────────────────────────────────────────────────────────
    auto_pct = round(
        sum(1 for s in sessions if s.permission_mode == "auto") / total * 100, 1
    )
    all_models: set[str] = set()
    for s in sessions:
        all_models.update(s.models_used)

    projects = sorted(set(s.project for s in sessions))

    return {
        "analysis_period": {
            "start": min_dt.isoformat(),
            "end":   max_dt.isoformat(),
            "days":  date_range_days,
        },
        "session_counts": {
            "total":               total,
            "with_user_activity":  with_activity,
        },
        "duration": {
            "avg_active_minutes_per_session": avg_duration,
            "peak_time":             dominant_peak,
            "peak_time_distribution": dict(peak_counts),
        },
        "tokens": {
            "total_output":          total_output,
            "total_input":           total_input,
            "total_cache_read":      total_cache_r,
            "avg_cache_efficiency_pct": avg_cache_eff,
        },
        "tool_usage": {
            "total_invocations":    total_invocations,
            "top_tools":            top_tools,
            "category_percentages": cat_pcts,
            "write_to_read_ratio":  wr_ratio,
        },
        "agentic_patterns": {
            "total_workflows":                  total_workflows,
            "sessions_with_advisor_model":      advisor_sessions,
            "sessions_with_agent_tools":        agent_sessions,
            "sessions_with_subagent_delegation": sidechain_sessions,
            "agentic_tool_pct":                 cat_pcts.get("agent", 0.0),
        },
        "development_patterns": {
            "refactor_ratio_edit_vs_write": refactor_ratio,
            "avg_turns_per_session":        avg_turns,
            "debug_signal_per_session":     debug_rate,
            "web_research_pct":             cat_pcts.get("web", 0.0),
            "planning_tool_pct":            cat_pcts.get("plan", 0.0),
        },
        "operational": {
            "auto_permission_mode_pct": auto_pct,
            "models_used":              sorted(all_models),
            "project_count":            len(projects),
            "projects":                 projects,
        },
    }
