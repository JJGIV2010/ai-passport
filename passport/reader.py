"""
Stream Claude Code session JSONL files and emit only behavioral metadata.

Privacy contract: this module NEVER reads or yields:
  - user message content (prompts)
  - tool_use input fields (file paths, code, arguments)
  - assistant message text content
  - any string that could identify project IP

Only counts, timestamps, tool names, and numeric usage stats flow out.
"""

import json
from pathlib import Path
from datetime import datetime
from typing import Iterator
from dataclasses import dataclass, field


CLAUDE_PROJECTS_DIR = Path.home() / ".claude" / "projects"

IDLE_GAP_SECONDS = 30 * 60  # 30 min gap = new active block

TOOL_CATEGORIES = {
    "read":  {"Read", "Glob", "Grep"},
    "write": {"Edit", "Write", "NotebookEdit"},
    "exec":  {"Bash", "PowerShell"},
    "agent": {"Agent", "Workflow", "Skill", "SendMessage"},
    "web":   {"WebSearch", "WebFetch"},
    "plan":  {"TaskCreate", "TaskUpdate", "TaskGet", "TaskList",
               "EnterPlanMode", "ExitPlanMode"},
}

def categorize_tool(name: str) -> str:
    for cat, names in TOOL_CATEGORIES.items():
        if name in names:
            return cat
    return "other"


@dataclass
class SessionMetrics:
    session_id: str
    project: str
    start_time: datetime
    end_time: datetime
    active_minutes: float

    user_turns: int = 0
    assistant_turns: int = 0

    tool_uses: dict[str, int] = field(default_factory=dict)
    tool_categories: dict[str, int] = field(default_factory=dict)

    output_tokens: int = 0
    input_tokens: int = 0
    cache_read_tokens: int = 0
    cache_creation_tokens: int = 0
    cache_efficiency_pct: float = 0.0

    models_used: set = field(default_factory=set)
    advisor_model_invoked: bool = False
    permission_mode: str = "default"
    git_branches: set = field(default_factory=set)
    stop_reasons: dict[str, int] = field(default_factory=dict)

    workflow_count: int = 0
    debug_iteration_signals: int = 0
    has_sidechain_activity: bool = False
    peak_time: str = "unknown"

    @property
    def total_tool_uses(self) -> int:
        return sum(self.tool_uses.values())

    @property
    def write_to_read_ratio(self) -> float:
        reads = self.tool_categories.get("read", 0)
        writes = self.tool_categories.get("write", 0)
        if reads == 0:
            return float(writes > 0) * 99.0
        return round(writes / reads, 2)

    def to_dict(self) -> dict:
        d = self.__dict__.copy()
        d["start_time"] = self.start_time.isoformat()
        d["end_time"] = self.end_time.isoformat()
        d["models_used"] = list(self.models_used)
        d["git_branches"] = list(self.git_branches)
        d["write_to_read_ratio"] = self.write_to_read_ratio
        d["total_tool_uses"] = self.total_tool_uses
        return d


def _parse_ts(ts_str: str | None) -> datetime | None:
    if not ts_str:
        return None
    try:
        return datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return None


def _active_minutes(timestamps: list[datetime]) -> float:
    """Sum only intra-gap durations below the idle threshold."""
    if len(timestamps) < 2:
        return 0.0
    active = 0.0
    for i in range(1, len(timestamps)):
        gap = (timestamps[i] - timestamps[i - 1]).total_seconds()
        if gap < IDLE_GAP_SECONDS:
            active += gap
    return round(active / 60, 1)


def _peak_time(dt: datetime) -> str:
    h = dt.hour  # UTC — acceptable approximation
    if 5 <= h < 12:
        return "morning"
    if 12 <= h < 18:
        return "afternoon"
    return "evening"


def read_session(jsonl_path: Path) -> SessionMetrics | None:
    """
    Stream a single session JSONL and return behavioral metrics.
    Returns None if the file is empty or has no timestamps.
    """
    timestamps: list[datetime] = []
    user_turns = 0
    assistant_turns = 0
    tool_uses: dict[str, int] = {}
    tool_categories: dict[str, int] = {}
    output_tokens = input_tokens = cache_read = cache_creation = 0
    models_used: set[str] = set()
    advisor_model_invoked = False
    permission_mode = "default"
    git_branches: set[str] = set()
    stop_reasons: dict[str, int] = {}
    workflow_count = 0
    debug_signals = 0
    has_sidechain = False
    last_tool_cat: str | None = None

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

                if msg.get("isSidechain"):
                    has_sidechain = True
                    continue  # exclude subagent turns from user metrics

                branch = msg.get("gitBranch")
                if branch:
                    git_branches.add(branch)

                mtype = msg.get("type")

                if mtype == "permission-mode":
                    permission_mode = msg.get("permissionMode", "default")

                elif mtype == "user":
                    user_turns += 1

                elif mtype == "assistant":
                    assistant_turns += 1
                    message = msg.get("message") or {}

                    if msg.get("advisorModel"):
                        advisor_model_invoked = True

                    model = message.get("model")
                    if model:
                        models_used.add(model)

                    sr = message.get("stop_reason")
                    if sr:
                        stop_reasons[sr] = stop_reasons.get(sr, 0) + 1

                    usage = message.get("usage") or {}
                    output_tokens   += usage.get("output_tokens", 0) or 0
                    input_tokens    += usage.get("input_tokens", 0) or 0
                    cache_read      += usage.get("cache_read_input_tokens", 0) or 0
                    cache_creation  += usage.get("cache_creation_input_tokens", 0) or 0

                    for block in message.get("content") or []:
                        if not isinstance(block, dict):
                            continue
                        if block.get("type") != "tool_use":
                            continue
                        # Only read tool NAME — never read block["input"]
                        name = block.get("name", "unknown")
                        tool_uses[name] = tool_uses.get(name, 0) + 1
                        cat = categorize_tool(name)
                        tool_categories[cat] = tool_categories.get(cat, 0) + 1

                        if name == "Workflow":
                            workflow_count += 1

                        # Read→Exec→Read = debugging iteration signal
                        if last_tool_cat == "exec" and cat == "read":
                            debug_signals += 1
                        last_tool_cat = cat

    except OSError:
        return None

    if not timestamps:
        return None

    timestamps.sort()
    total_ctx = input_tokens + cache_read + cache_creation
    cache_eff = round(cache_read / total_ctx * 100, 1) if total_ctx > 0 else 0.0

    return SessionMetrics(
        session_id=jsonl_path.stem,
        project=jsonl_path.parent.name,
        start_time=timestamps[0],
        end_time=timestamps[-1],
        active_minutes=_active_minutes(timestamps),
        user_turns=user_turns,
        assistant_turns=assistant_turns,
        tool_uses=tool_uses,
        tool_categories=tool_categories,
        output_tokens=output_tokens,
        input_tokens=input_tokens,
        cache_read_tokens=cache_read,
        cache_creation_tokens=cache_creation,
        cache_efficiency_pct=cache_eff,
        models_used=models_used,
        advisor_model_invoked=advisor_model_invoked,
        permission_mode=permission_mode,
        git_branches=git_branches,
        stop_reasons=stop_reasons,
        workflow_count=workflow_count,
        debug_iteration_signals=debug_signals,
        has_sidechain_activity=has_sidechain,
        peak_time=_peak_time(timestamps[0]),
    )


def iter_all_sessions(
    base_dir: Path = CLAUDE_PROJECTS_DIR,
    days: int | None = None,
    verbose: bool = False,
) -> Iterator[SessionMetrics]:
    """
    Walk all project directories under base_dir and yield SessionMetrics
    for every readable JSONL file, optionally filtered by recency.
    """
    from datetime import timezone, timedelta

    cutoff = None
    if days:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    for project_dir in sorted(base_dir.iterdir()):
        if not project_dir.is_dir():
            continue
        for jsonl_file in sorted(project_dir.glob("*.jsonl")):
            if verbose:
                print(f"  reading {project_dir.name[:40]}/{jsonl_file.name[:36]}…")
            session = read_session(jsonl_file)
            if session is None:
                continue
            if cutoff and session.start_time < cutoff:
                continue
            yield session
