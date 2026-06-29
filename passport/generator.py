"""
Profile generator: takes behavioral metrics JSON, calls Claude API,
returns a validated PassportProfile.

Only pure metrics (numbers, counts, ratios) are sent to the API.
No session content, prompts, or file paths are included.
"""

from __future__ import annotations
import json
import os
from typing import Any

import anthropic
from pydantic import ValidationError

from .schema import PassportProfile

_SYSTEM_PROMPT = """\
You are analyzing a software developer's AI collaboration history to generate a capability profile.

CRITICAL CONSTRAINTS:
- The input is BEHAVIORAL METRICS ONLY — counts, ratios, timestamps, tool names.
- Do NOT fabricate signals. If data is insufficient, set the field to null and note confidence = "insufficient_data".
- Every numeric score must be justified by the metrics provided.
- Output must be a single JSON object matching the profile schema exactly.

ANALYSIS GUIDELINES:
1. Session count and time distribution → session_counts, duration
2. Token scale and cache efficiency → signals.context_window_efficiency, strengths
3. Tool usage patterns and ratios → development_patterns, development_style
4. Execution tool frequency → testing/debugging proxies (medium confidence)
5. Edit-vs-write ratio → refactoring discipline (high confidence)
6. Agent/Workflow tool presence → agentic_patterns → specialties
7. Project names (sanitized) → specialty domain inference
8. Model diversity → early_adopter signal
9. Advisor model usage rate → systematic_approach score
10. Turns per session + duration → deep_work_capacity

SCORING:
- ai_engineering_score: use the value in metrics["precomputed_score"] EXACTLY — do not
  recalculate. The score is deterministically computed before this API call.
- score_rationale: explain the score using the provided breakdown in metrics["score_breakdown"].
- All other sub-scores: defensible from the metrics, not aspirational.
"""

_GENERATION_PROMPT_TEMPLATE = """\
Generate a PassportProfile JSON from the following behavioral metrics.

METRICS:
{metrics_json}

Generate the complete profile JSON object now.
"""


def generate_profile(
    metrics: dict[str, Any],
    model: str | None = None,
    api_key: str | None = None,
) -> PassportProfile:
    """
    Call Claude API with metrics dict and return a validated PassportProfile.
    Raises RuntimeError on API failure, ValidationError if schema mismatch.
    """
    resolved_model = model or os.getenv("PASSPORT_GENERATOR_MODEL", "claude-sonnet-4-6")
    client = anthropic.Anthropic(api_key=api_key or os.getenv("ANTHROPIC_API_KEY"))

    metrics_json = json.dumps(metrics, indent=2, default=str)
    user_content = _GENERATION_PROMPT_TEMPLATE.format(metrics_json=metrics_json)

    # Build the tool schema from the Pydantic model
    profile_schema = PassportProfile.model_json_schema()

    response = client.messages.create(
        model=resolved_model,
        max_tokens=8192,
        system=_SYSTEM_PROMPT,
        tools=[{
            "name": "output_profile",
            "description": "Output the completed PassportProfile JSON.",
            "input_schema": profile_schema,
        }],
        tool_choice={"type": "tool", "name": "output_profile"},
        messages=[{"role": "user", "content": user_content}],
    )

    # Extract tool_use result
    tool_block = next(
        (b for b in response.content if b.type == "tool_use"),
        None,
    )
    if tool_block is None:
        raise RuntimeError("API did not return a tool_use block.")

    raw: dict[str, Any] = tool_block.input  # type: ignore[attr-defined]

    try:
        return PassportProfile.model_validate(raw)
    except ValidationError as exc:
        raise ValidationError(exc.errors(), PassportProfile) from exc
