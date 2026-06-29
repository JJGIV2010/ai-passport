"""
Stream OpenAI Codex CLI session JSONL files and emit behavioral metadata.

Privacy contract: identical to reader.py — no prompt content, no file paths,
no stdout/stderr, no diff content, no source code is read or yielded.
Only event types, counts, timestamps, command verbs, and token numbers flow out.

Codex session format differs from Claude Code:
  - event_msg subtypes drive the action record (exec_command_end, patch_apply_end, etc.)
  - turn_context carries per-turn model and reasoning_effort
  - token_count events carry cumulative token tallies
  - No named tool taxonomy; shell commands and file patches are the primitives
"""

from __future__ import annotations
import json
from pathlib import Path
from datetime import datetime
from typing import Iterator
from dataclasses import dataclass, field

CODEX_SESSIONS_DIR = Path.home() / ".codex" / "sessions"

IDLE_GAP_SECONDS = 30 * 60

# Command prefixes that constitute read-only exploration
_READ_PREFIXES: tuple[str, ...] = (
    "rg", "grep", "find", "cat", "head", "tail", "type",   # file reading
    "git log", "git status", "git diff", "git show",        # git inspection
    "ls", "dir", "Get-ChildItem", "Get-Content",            # directory/file listing
    "echo", "where", "which", "python --version",           # info queries
    "npm list", "pip list", "pip show",                     # package inspection
    "curl", "wget",                                          # web reads
)

# Command prefixes that constitute write/implementation work
_WRITE_PREFIXES: tuple[str, ...] = (
    "git commit", "git add", "git push", "git merge",
    "npm install", "npm run build", "pip install",
    "python ", "py ",                                        # script execution
    "mv ", "cp ", "mkdir ", "New-Item",
    "rm ", "del ", "Remove-Item",
)


def _cmd_verb(command: list[str] | None) -> str:
    """
    Extract the effective verb from a Codex command array.
    Never reads the content of arguments — only the command name/flags.
    """
    if not command:
        return "unknown"
    # Codex on Windows wraps everything in powershell.exe -Command <str>
    # The real command is usually the last element when using that pattern
    if len(command) >= 3 and "powershell" in command[0].lower() and command[1].lower() in ("-command", "/command"):
        inner = command[2].strip() if len(command) > 2 else ""
        verb = inner.split()[0] if inner else "powershell"
        return verb.lower().rstrip(";")
    return command[0].lower()


def _categorize_cmd(command: list[str] | None) -> str:
    """Classify a command as read/write/exec without inspecting arguments."""
    if not command:
        return "exec"
    joined = " ".join(command).lower()
    for pfx in _READ_PREFIXES:
        if pfx in joined:
            return "read"
    for pfx in _WRITE_PREFIXES:
        if pfx in joined:
            return "write"
    return "exec"


def _parse_ts(ts_str: str | None) -> datetime | None:
    if not ts_str:
        return None
    try:
        return datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return None


def _active_minutes(timestamps: list[datetime]) -> float:
    if len(timestamps) < 2:
        return 0.0
    active = 0.0
    for i in range(1, len(timestamps)):
        gap = (timestamps[i] - timestamps[i - 1]).total_seconds()
        if gap < IDLE_GAP_SECONDS:
            active += gap
    return round(active / 60, 1)


def _peak_time(dt: datetime) -> str:
    h = dt.hour
    if 5 <= h < 12:
        return "morning"
    if 12 <= h < 18:
        return "afternoon"
    return "evening"


@dataclass
class CodexSessionMetrics:
    session_id: str
    project: str          # basename of cwd from session_meta
    session_path: str     # relative path under ~/.codex/sessions/

    start_time: datetime
    end_time: datetime
    active_minutes: float

    user_turns: int = 0

    # Shell command execution
    exec_counts: dict[str, int] = field(default_factory=dict)  # verb → count
    exec_categories: dict[str, int] = field(default_factory=dict)  # read/write/exec
    exec_total: int = 0
    exec_errors: int = 0        # commands with exit_code != 0
    exec_total_duration_secs: float = 0.0

    # File patches (write-level operations)
    patch_count: int = 0
    patch_failures: int = 0
    files_patched: int = 0      # distinct files modified (count only, no paths)

    # Token usage (cumulative from final token_count event)
    input_tokens: int = 0
    cached_input_tokens: int = 0
    output_tokens: int = 0
    reasoning_tokens: int = 0
    cache_efficiency_pct: float = 0.0

    # Model and reasoning
    models_used: set = field(default_factory=set)
    reasoning_efforts: set = field(default_factory=set)  # low/medium/high
    plan_mode_turns: int = 0

    # Session-level flags
    had_errors: bool = False
    had_aborted_turns: bool = False
    had_context_compaction: bool = False

    peak_time: str = "unknown"

    @property
    def total_operations(self) -> int:
        return self.exec_total + self.patch_count

    def to_dict(self) -> dict:
        d = self.__dict__.copy()
        d["start_time"] = self.start_time.isoformat()
        d["end_time"] = self.end_time.isoformat()
        d["models_used"] = list(self.models_used)
        d["reasoning_efforts"] = list(self.reasoning_efforts)
        d["total_operations"] = self.total_operations
        return d


def read_codex_session(jsonl_path: Path) -> CodexSessionMetrics | None:
    """
    Stream a single Codex session JSONL and return behavioral metrics.
    Returns None if the file is empty or unreadable.
    """
    timestamps: list[datetime] = []
    user_turns = 0
    exec_counts: dict[str, int] = {}
    exec_categories: dict[str, int] = {}
    exec_total = 0
    exec_errors = 0
    exec_duration = 0.0
    patch_count = 0
    patch_failures = 0
    files_patched = 0
    input_tokens = cached_tokens = output_tokens = reasoning_tokens = 0
    models_used: set[str] = set()
    reasoning_efforts: set[str] = set()
    plan_mode_turns = 0
    had_errors = had_aborted = had_compaction = False

    session_id: str = jsonl_path.stem
    cwd: str = ""

    # Relative path under ~/.codex/sessions/ for readable project label
    try:
        rel = jsonl_path.relative_to(CODEX_SESSIONS_DIR)
        session_path = str(rel)
    except ValueError:
        session_path = str(jsonl_path)

    try:
        with open(jsonl_path, "r", encoding="utf-8", errors="replace") as fh:
            for raw in fh:
                raw = raw.strip()
                if not raw:
                    continue
                try:
                    msg = json.loads(raw)
                except json.JSONDecodeError:
                    continue

                ts = _parse_ts(msg.get("timestamp"))
                if ts:
                    timestamps.append(ts)

                mtype = msg.get("type")
                payload = msg.get("payload") or {}

                if mtype == "session_meta":
                    cwd = payload.get("cwd", "")
                    sid = payload.get("id")
                    if sid:
                        session_id = sid

                elif mtype == "turn_context":
                    model = payload.get("model")
                    if model:
                        models_used.add(model)
                    effort = (
                        payload.get("collaboration_mode", {})
                               .get("settings", {})
                               .get("reasoning_effort")
                    )
                    if effort:
                        reasoning_efforts.add(effort)
                    mode = (
                        payload.get("collaboration_mode", {})
                               .get("mode", "default")
                    )
                    if mode == "plan":
                        plan_mode_turns += 1

                elif mtype == "event_msg":
                    etype = payload.get("type")

                    if etype == "user_message":
                        user_turns += 1

                    elif etype == "exec_command_end":
                        command = payload.get("command")  # list[str] — categorized by verb only
                        exit_code = payload.get("exit_code", 0)
                        dur_secs = (payload.get("duration") or {}).get("secs", 0) or 0
                        dur_nanos = (payload.get("duration") or {}).get("nanos", 0) or 0

                        verb = _cmd_verb(command)
                        cat = _categorize_cmd(command)

                        exec_counts[verb] = exec_counts.get(verb, 0) + 1
                        exec_categories[cat] = exec_categories.get(cat, 0) + 1
                        exec_total += 1
                        if exit_code != 0:
                            exec_errors += 1
                        exec_duration += dur_secs + dur_nanos / 1e9

                    elif etype == "patch_apply_end":
                        patch_count += 1
                        if not payload.get("success", True):
                            patch_failures += 1
                        # Count patched files (count only — never read filenames)
                        changes = payload.get("changes") or {}
                        files_patched += len(changes)

                    elif etype == "error":
                        had_errors = True

                    elif etype == "turn_aborted":
                        had_aborted = True

                    elif etype == "context_compacted":
                        had_compaction = True

                elif mtype == "token_count":
                    info = msg.get("info")
                    if info:
                        usage = info.get("total_token_usage") or {}
                        input_tokens   = usage.get("input_tokens", 0) or 0
                        cached_tokens  = usage.get("cached_input_tokens", 0) or 0
                        output_tokens  = usage.get("output_tokens", 0) or 0
                        reasoning_tokens = usage.get("reasoning_output_tokens", 0) or 0

    except OSError:
        return None

    if not timestamps:
        return None

    timestamps.sort()
    project = Path(cwd).name if cwd else "unknown"
    total_ctx = input_tokens + cached_tokens
    cache_eff = round(cached_tokens / total_ctx * 100, 1) if total_ctx > 0 else 0.0

    return CodexSessionMetrics(
        session_id=session_id,
        project=project,
        session_path=session_path,
        start_time=timestamps[0],
        end_time=timestamps[-1],
        active_minutes=_active_minutes(timestamps),
        user_turns=user_turns,
        exec_counts=exec_counts,
        exec_categories=exec_categories,
        exec_total=exec_total,
        exec_errors=exec_errors,
        exec_total_duration_secs=round(exec_duration, 2),
        patch_count=patch_count,
        patch_failures=patch_failures,
        files_patched=files_patched,
        input_tokens=input_tokens,
        cached_input_tokens=cached_tokens,
        output_tokens=output_tokens,
        reasoning_tokens=reasoning_tokens,
        cache_efficiency_pct=cache_eff,
        models_used=models_used,
        reasoning_efforts=reasoning_efforts,
        plan_mode_turns=plan_mode_turns,
        had_errors=had_errors,
        had_aborted_turns=had_aborted,
        had_context_compaction=had_compaction,
        peak_time=_peak_time(timestamps[0]),
    )


def iter_codex_sessions(
    base_dir: Path = CODEX_SESSIONS_DIR,
    days: int | None = None,
    verbose: bool = False,
) -> Iterator[CodexSessionMetrics]:
    """Walk ~/.codex/sessions/ and yield CodexSessionMetrics per JSONL file."""
    from datetime import timezone, timedelta

    cutoff = None
    if days and days != 0:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    for jsonl_file in sorted(base_dir.rglob("*.jsonl")):
        if verbose:
            print(f"  reading codex {jsonl_file.name[:36]}…")
        session = read_codex_session(jsonl_file)
        if session is None:
            continue
        if cutoff and session.start_time < cutoff:
            continue
        yield session


def aggregate_codex(sessions: list[CodexSessionMetrics]) -> dict:
    """Aggregate Codex session metrics into profile-level signals."""
    if not sessions:
        return {}

    min_dt = min(s.start_time for s in sessions)
    max_dt = max(s.end_time for s in sessions)

    total = len(sessions)
    durations = [s.active_minutes for s in sessions if s.active_minutes > 0]
    avg_duration = round(sum(durations) / len(durations), 1) if durations else 0.0

    from collections import Counter
    peak_counts = Counter(s.peak_time for s in sessions)

    # Token totals (final cumulative snapshot per session)
    total_output   = sum(s.output_tokens for s in sessions)
    total_input    = sum(s.input_tokens for s in sessions)
    total_cached   = sum(s.cached_input_tokens for s in sessions)
    total_reasoning = sum(s.reasoning_tokens for s in sessions)
    avg_cache_eff  = round(sum(s.cache_efficiency_pct for s in sessions) / total, 1)

    # Operations
    total_execs    = sum(s.exec_total for s in sessions)
    total_patches  = sum(s.patch_count for s in sessions)
    total_errors   = sum(s.exec_errors for s in sessions)
    error_rate     = round(total_errors / total_execs, 3) if total_execs else 0.0
    total_files    = sum(s.files_patched for s in sessions)

    # Verb distribution (exec commands)
    all_verbs: dict[str, int] = {}
    all_cats:  dict[str, int] = {}
    for s in sessions:
        for v, c in s.exec_counts.items():
            all_verbs[v] = all_verbs.get(v, 0) + c
        for cat, c in s.exec_categories.items():
            all_cats[cat] = all_cats.get(cat, 0) + c

    top_verbs = sorted(all_verbs.items(), key=lambda x: x[1], reverse=True)[:10]
    total_ops = total_execs + total_patches
    cat_pcts: dict[str, float] = {}
    if total_ops:
        cat_pcts = {
            cat: round(c / total_ops * 100, 1)
            for cat, c in all_cats.items()
        }
        cat_pcts["patch"] = round(total_patches / total_ops * 100, 1)

    # Models and reasoning
    all_models: set[str] = set()
    all_efforts: set[str] = set()
    for s in sessions:
        all_models.update(s.models_used)
        all_efforts.update(s.reasoning_efforts)

    plan_sessions = sum(1 for s in sessions if s.plan_mode_turns > 0)
    error_sessions = sum(1 for s in sessions if s.had_errors)
    compaction_sessions = sum(1 for s in sessions if s.had_context_compaction)

    projects = sorted(set(s.project for s in sessions))

    avg_turns = round(sum(s.user_turns for s in sessions) / total, 1)

    return {
        "source": "codex_cli",
        "analysis_period": {
            "start": min_dt.isoformat(),
            "end":   max_dt.isoformat(),
            "days":  (max_dt - min_dt).days + 1,
        },
        "session_counts": {
            "total":         total,
            "plan_mode":     plan_sessions,
            "with_errors":   error_sessions,
            "with_compaction": compaction_sessions,
        },
        "duration": {
            "avg_active_minutes_per_session": avg_duration,
            "peak_time": peak_counts.most_common(1)[0][0],
            "peak_time_distribution": dict(peak_counts),
        },
        "tokens": {
            "total_output":          total_output,
            "total_input":           total_input,
            "total_cached_input":    total_cached,
            "total_reasoning":       total_reasoning,
            "avg_cache_efficiency_pct": avg_cache_eff,
            "reasoning_pct_of_output": (
                round(total_reasoning / total_output * 100, 1) if total_output else 0.0
            ),
        },
        "operations": {
            "total_exec_commands":  total_execs,
            "total_file_patches":   total_patches,
            "total_files_patched":  total_files,
            "exec_error_rate":      error_rate,
            "category_pct":         cat_pcts,
            "top_command_verbs":    top_verbs,
        },
        "agentic_patterns": {
            "plan_mode_sessions":   plan_sessions,
            "avg_turns_per_session": avg_turns,
        },
        "operational": {
            "models_used":          sorted(all_models),
            "reasoning_efforts":    sorted(all_efforts),
            "project_count":        len(projects),
            "projects":             projects,
        },
    }
