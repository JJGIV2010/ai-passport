"""Deterministic AI engineering score computed from behavioral metrics."""
from __future__ import annotations
import math
from typing import Any


def compute_score(metrics: dict[str, Any]) -> tuple[int, dict[str, Any]]:
    """
    Deterministic weighted composite score from Claude Code behavioral metrics.

    Weights: cache_efficiency 20, session_depth 20 (turns 10 + duration 10),
             agentic_usage 15, refactoring 15, project_breadth 10,
             model_adoption 10, advisor_usage 10.
    """
    n = metrics["session_counts"]["total"]

    # Cache efficiency (20 pts) — linear
    cache_eff = metrics["tokens"]["avg_cache_efficiency_pct"]
    cache_pts = min(20, round(cache_eff * 20 / 100))

    # Session depth (20 pts) — turns + duration
    avg_turns = metrics["development_patterns"]["avg_turns_per_session"]
    avg_min = metrics["duration"]["avg_active_minutes_per_session"]
    turns_pts = min(10, round(avg_turns / 40))   # 400 turns → 10 pts
    dur_pts = min(10, round(avg_min / 24))        # 240 min  → 10 pts
    depth_pts = turns_pts + dur_pts

    # Agentic usage (15 pts)
    agent_s = metrics["agentic_patterns"]["sessions_with_agent_tools"]
    agentic_pts = min(15, round(agent_s / n * 15)) if n else 0

    # Refactoring discipline (15 pts)
    refactor = metrics["development_patterns"]["refactor_ratio_edit_vs_write"]
    refactor_pts = min(15, round(refactor * 15))

    # Project breadth (10 pts) — logarithmic diminishing returns
    projects = metrics["operational"]["project_count"]
    breadth_pts = min(10, round(math.log(projects + 1) / math.log(11) * 10)) if projects else 0

    # Model adoption (10 pts) — 2 pts per distinct model
    models = len(metrics["operational"]["models_used"])
    model_pts = min(10, models * 2)

    # Advisor model usage (10 pts)
    advisor_s = metrics["agentic_patterns"]["sessions_with_advisor_model"]
    advisor_pts = min(10, round(advisor_s / n * 10)) if n else 0

    score = min(100, cache_pts + depth_pts + agentic_pts + refactor_pts
                + breadth_pts + model_pts + advisor_pts)

    breakdown = {
        "cache_efficiency":       {"pts": cache_pts,    "max": 20, "value": f"{cache_eff}%"},
        "session_depth":          {"pts": depth_pts,    "max": 20,
                                   "turns_pts": turns_pts, "duration_pts": dur_pts,
                                   "value": f"{avg_turns:.0f} turns, {avg_min:.0f} min"},
        "agentic_usage":          {"pts": agentic_pts,  "max": 15, "value": f"{agent_s}/{n} sessions"},
        "refactoring_discipline": {"pts": refactor_pts, "max": 15, "value": f"ratio {refactor}"},
        "project_breadth":        {"pts": breadth_pts,  "max": 10, "value": f"{projects} projects"},
        "model_adoption":         {"pts": model_pts,    "max": 10, "value": f"{models} models"},
        "advisor_usage":          {"pts": advisor_pts,  "max": 10, "value": f"{advisor_s}/{n} sessions"},
    }

    return score, breakdown
