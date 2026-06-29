export interface PassportProfile {
  metadata: {
    user_id: string | null
    generated_at: string
    analysis_period: { start: string; end: string; days: number }
    schema_version: string
    extractor_version: string
    analysis_confidence: 'high' | 'medium' | 'low'
    notes?: string
  }
  summary: {
    ai_engineering_score: number
    sessions_analyzed: number
    analysis_quality: 'high' | 'medium' | 'low'
    total_sessions: number
    date_range_days: number
    score_rationale: string
  }
  verified_experience: {
    development_sessions: {
      count: number
      avg_active_duration_minutes: number
      peak_time: string
      peak_time_distribution: Record<string, number>
      avg_turns_per_session: number
    }
    token_scale: {
      total_output_tokens: number
      total_input_tokens: number
      total_cache_read_tokens: number
      avg_output_per_session: number
      context_window_efficiency_pct: number
    }
    production_indicators: {
      probable_production_work: boolean
      rationale: string
      deployment_signals: number
      architectural_planning_sessions: number
    }
    integrations_built: number
    tools_built: string[]
    project_count: number
  }
  tool_usage: {
    claude_code: Record<string, unknown>
    tool_invocations_total: number
    top_tools_ranked: Array<{ name: string; count: number; pct: number }>
    category_breakdown_pct: Record<string, number>
    models_used: string[]
    model_adoption_signal?: string
  }
  development_patterns: {
    testing: { tdd_indicator: number | null; testing_frequency: number | null; rationale: string; confidence: string }
    refactoring: { frequency: number; edit_to_write_ratio: number; rationale: string; confidence: string }
    documentation: { quality_signal: number | null; rationale: string; confidence: string }
    debugging: { iterations_per_session: number; systematic_approach: number; rationale: string; confidence: string }
  }
  specialties: Array<{ domain: string; confidence: number; evidence: string }>
  strengths: Array<{ capability: string; score: number; indicator: string }>
  development_style: Record<string, boolean | null>
  badges: {
    earned: Array<{ id: string; label: string; description: string; threshold: string; achieved: boolean }>
    eligible: Array<{ id: string; label: string; description: string; gap: string; current: number }>
  }
  signals: {
    complexity_preference: string
    tool_mastery: number
    context_window_efficiency: number
    successful_task_completion: number | null
    note_on_completion?: string
  }
}
