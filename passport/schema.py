"""
Pydantic v2 schema for the AI Capability Passport profile.
This is the source of truth for the profile JSON structure.
"""

from __future__ import annotations
from typing import Any, Literal
from pydantic import BaseModel, Field


class AnalysisPeriod(BaseModel):
    start: str
    end: str
    days: int


class ProfileMetadata(BaseModel):
    user_id: str | None = None
    generated_at: str
    analysis_period: AnalysisPeriod
    schema_version: str = "1.0.0"
    extractor_version: str
    analysis_confidence: Literal["high", "medium", "low"] = "high"
    notes: str | None = None


class ProfileSummary(BaseModel):
    ai_engineering_score: int = Field(ge=0, le=100)
    sessions_analyzed: int
    analysis_quality: Literal["high", "medium", "low"]
    total_sessions: int
    date_range_days: int
    score_rationale: str


class DevelopmentSessions(BaseModel):
    count: int
    avg_active_duration_minutes: float
    peak_time: Literal["morning", "afternoon", "evening"]
    peak_time_distribution: dict[str, int]
    avg_turns_per_session: float


class TokenScale(BaseModel):
    total_output_tokens: int
    total_input_tokens: int
    total_cache_read_tokens: int
    avg_output_per_session: int
    context_window_efficiency_pct: float


class ProductionIndicators(BaseModel):
    probable_production_work: bool
    rationale: str
    deployment_signals: int
    architectural_planning_sessions: int


class VerifiedExperience(BaseModel):
    development_sessions: DevelopmentSessions
    token_scale: TokenScale
    production_indicators: ProductionIndicators
    integrations_built: int
    tools_built: list[str]
    project_count: int


class ToolEntry(BaseModel):
    name: str
    count: int
    pct: float


class ToolUsage(BaseModel):
    claude_code: dict[str, Any]
    tool_invocations_total: int
    top_tools_ranked: list[ToolEntry]
    category_breakdown_pct: dict[str, float]
    models_used: list[str]
    model_adoption_signal: str | None = None


class TestingPattern(BaseModel):
    tdd_indicator: int | None = Field(None, ge=0, le=100)
    testing_frequency: int | None = Field(None, ge=0, le=100)
    test_coverage_signal: int | None = Field(None, ge=0, le=100)
    rationale: str
    confidence: Literal["high", "medium", "low", "insufficient_data"]


class RefactoringPattern(BaseModel):
    frequency: int = Field(ge=0, le=100)
    edit_to_write_ratio: float
    small_commit_style: bool | None = None
    rationale: str
    confidence: Literal["high", "medium", "low"]


class DocumentationPattern(BaseModel):
    quality_signal: int | None = Field(None, ge=0, le=100)
    frequency: int | None = Field(None, ge=0, le=100)
    rationale: str
    confidence: Literal["high", "medium", "low", "insufficient_data"]


class DebuggingPattern(BaseModel):
    iterations_per_session: float
    systematic_approach: int = Field(ge=0, le=100)
    rationale: str
    confidence: Literal["high", "medium", "low"]


class DevelopmentPatterns(BaseModel):
    testing: TestingPattern
    refactoring: RefactoringPattern
    documentation: DocumentationPattern
    debugging: DebuggingPattern


class Specialty(BaseModel):
    domain: str
    confidence: int = Field(ge=0, le=100)
    evidence: str


class Strength(BaseModel):
    capability: str
    score: int = Field(ge=0, le=100)
    indicator: str


class DevelopmentStyle(BaseModel):
    iterative: bool
    systematic: bool
    production_focused: bool
    documentation_emphasis: bool | None = None
    test_driven: bool
    execution_heavy: bool
    long_session_worker: bool
    early_adopter: bool
    vertical_specialist: bool | None = None


class Badge(BaseModel):
    id: str
    label: str
    description: str
    threshold: str
    achieved: bool


class EligibleBadge(BaseModel):
    id: str
    label: str
    description: str
    threshold: str
    current: int | float
    gap: str


class Badges(BaseModel):
    earned: list[Badge]
    eligible: list[EligibleBadge]


class Signals(BaseModel):
    complexity_preference: Literal["simple", "medium", "complex"]
    tool_mastery: int = Field(ge=0, le=100)
    context_window_efficiency: float
    successful_task_completion: int | None = Field(None, ge=0, le=100)
    note_on_completion: str | None = None


class PassportProfile(BaseModel):
    metadata: ProfileMetadata
    summary: ProfileSummary
    verified_experience: VerifiedExperience
    tool_usage: ToolUsage
    development_patterns: DevelopmentPatterns
    specialties: list[Specialty]
    strengths: list[Strength]
    development_style: DevelopmentStyle
    badges: Badges
    signals: Signals

    model_config = {"populate_by_name": True}
