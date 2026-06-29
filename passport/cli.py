"""CLI entry points for the AI Capability Passport tool."""

from __future__ import annotations
import base64
import json
import stat
import sys
import webbrowser
from datetime import datetime, timezone
from pathlib import Path

import click

from . import __version__
from .reader import CLAUDE_PROJECTS_DIR, iter_all_sessions
from .reader_codex import CODEX_SESSIONS_DIR, iter_codex_sessions, aggregate_codex
from .metrics import aggregate


@click.group()
@click.version_option(__version__)
def main():
    """AI Capability Passport — generate a behavioral profile from your Claude Code sessions."""


@main.command()
@click.option("--days", default=90, show_default=True,
              help="Only include sessions from the last N days.")
@click.option("--output", "-o", default="metrics.json", show_default=True,
              type=click.Path(), help="Output path for the metrics JSON.")
@click.option("--base-dir", default=None, type=click.Path(exists=True),
              help="Override the Claude projects directory.")
@click.option("--no-codex", is_flag=True, help="Skip Codex CLI sessions.")
@click.option("--verbose", "-v", is_flag=True)
def extract(days: int, output: str, base_dir: str | None, no_codex: bool, verbose: bool):
    """
    Read Claude Code (and optionally Codex CLI) session logs and emit behavioral metrics JSON.

    No prompt content, source code, or file paths are included in the output.
    Only counts, ratios, timestamps, and tool names are extracted.
    """
    base = Path(base_dir) if base_dir else CLAUDE_PROJECTS_DIR

    if not base.exists():
        click.echo(f"Error: Claude projects directory not found at {base}", err=True)
        sys.exit(1)

    click.echo(f"Extracting Claude Code sessions from {base} (last {days} days)…")
    sessions = list(iter_all_sessions(base, days=days, verbose=verbose))

    if not sessions:
        click.echo("No Claude Code sessions found in the specified window.", err=True)
        sys.exit(1)

    click.echo(f"Found {len(sessions)} Claude Code sessions across "
               f"{len(set(s.project for s in sessions))} projects.")

    metrics = aggregate(sessions)

    # Codex CLI sessions
    codex_metrics = None
    if not no_codex and CODEX_SESSIONS_DIR.exists():
        click.echo(f"Extracting Codex CLI sessions from {CODEX_SESSIONS_DIR}…")
        codex_sessions = list(iter_codex_sessions(days=days, verbose=verbose))
        if codex_sessions:
            click.echo(f"Found {len(codex_sessions)} Codex sessions.")
            codex_metrics = aggregate_codex(codex_sessions)
        else:
            click.echo("No Codex sessions found in the specified window.")

    out_path = Path(output)
    payload: dict = {
        "profile_metrics": metrics,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    if codex_metrics:
        payload["codex_metrics"] = codex_metrics

    out_path.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")
    click.echo(f"Metrics saved -> {out_path}")


@main.command()
@click.option("--metrics", "-m", required=True, type=click.Path(exists=True),
              help="Path to metrics.json produced by the extract command.")
@click.option("--output", "-o", default="profile.json", show_default=True,
              type=click.Path(), help="Output path for the profile JSON.")
@click.option("--model", default=None,
              help="Override the Claude model for generation.")
def generate(metrics: str, output: str, model: str | None):
    """
    Call the Claude API with behavioral metrics and generate a capability profile.

    Requires ANTHROPIC_API_KEY in environment or .env file.
    Only the metrics JSON (pure numbers/counts) is sent to the API.
    """
    from dotenv import load_dotenv
    load_dotenv()

    from .generator import generate_profile

    metrics_path = Path(metrics)
    raw = json.loads(metrics_path.read_text(encoding="utf-8"))
    profile_metrics = raw.get("profile_metrics", raw)

    click.echo(f"Generating profile from {metrics_path}…")
    try:
        profile = generate_profile(profile_metrics, model=model)
    except Exception as exc:
        click.echo(f"Error: {exc}", err=True)
        sys.exit(1)

    out_path = Path(output)
    out_path.write_text(
        profile.model_dump_json(indent=2, exclude_none=False),
        encoding="utf-8",
    )
    click.echo(f"Profile saved -> {out_path}")
    click.echo(f"AI Engineering Score: {profile.summary.ai_engineering_score}/100")
    click.echo("Open the UI to review and approve before sharing.")


@main.command()
@click.option("--days", default=90, show_default=True)
@click.option("--output", "-o", default="profile.json", show_default=True, type=click.Path())
@click.option("--model", default=None)
@click.option("--no-codex", is_flag=True, help="Skip Codex CLI sessions.")
@click.option("--codex-all", is_flag=True, help="Include all Codex history (ignore --days for Codex).")
@click.option("--verbose", "-v", is_flag=True)
@click.option("--open", "open_browser", is_flag=True, default=False,
              help="Open your passport in the browser after generating.")
@click.option("--qr", "gen_qr", is_flag=True, default=False,
              help="Generate an artistic QR card PNG (requires: pip install 'qrcode[pil]').")
@click.option("--name", default="", help="Your name for the QR card footer.")
def run(days: int, output: str, model: str | None, no_codex: bool, codex_all: bool,
        verbose: bool, open_browser: bool, gen_qr: bool, name: str):
    """Extract from Claude Code + Codex CLI, then generate profile in one step."""
    from dotenv import load_dotenv
    load_dotenv()

    from .scoring import compute_score

    click.echo(f"Running full pipeline (last {days} days)…")

    sessions = list(iter_all_sessions(CLAUDE_PROJECTS_DIR, days=days, verbose=verbose))
    if not sessions:
        click.echo("No Claude Code sessions found.", err=True)
        sys.exit(1)

    click.echo(f"Extracted {len(sessions)} Claude Code sessions.")
    metrics = aggregate(sessions)

    # Compute score deterministically before the API call
    score, score_breakdown = compute_score(metrics)

    codex_metrics = None
    if not no_codex and CODEX_SESSIONS_DIR.exists():
        codex_days = None if codex_all else days
        codex_sessions = list(iter_codex_sessions(days=codex_days, verbose=verbose))
        if codex_sessions:
            click.echo(f"Extracted {len(codex_sessions)} Codex sessions.")
            codex_metrics = aggregate_codex(codex_sessions)

    combined_metrics = {
        "claude_code": metrics,
        "precomputed_score": score,
        "score_breakdown": score_breakdown,
    }
    if codex_metrics:
        combined_metrics["codex"] = codex_metrics

    from .generator import generate_profile
    click.echo("Generating profile via Claude API…")
    try:
        profile = generate_profile(combined_metrics, model=model)
    except Exception as exc:
        click.echo(f"Error: {exc}", err=True)
        sys.exit(1)

    # Save profile (compact JSON) and make read-only
    out_path = Path(output).resolve()
    profile_json = profile.model_dump_json(exclude_none=False)
    out_path.write_text(profile_json, encoding="utf-8")
    try:
        out_path.chmod(stat.S_IRUSR | stat.S_IRGRP | stat.S_IROTH)
    except Exception:
        pass  # read-only is best-effort on all platforms

    # Shareable URL (compact base64, uncompressed — works everywhere)
    b64 = base64.b64encode(profile_json.encode("utf-8")).decode("ascii")
    b64_url = b64.replace("+", "-").replace("/", "_").rstrip("=")
    share_url = f"https://aipassport.web.app/review#p={b64_url}"

    # Minimal URL for QR (key stats only, ~800 chars total)
    minimal = {
        "v": 1,
        "s": profile.summary.ai_engineering_score,
        "d": profile.metadata.analysis_period.days,
        "n": profile.summary.sessions_analyzed,
        "ce": round(profile.verified_experience.token_scale.context_window_efficiency_pct, 1),
        "t": round(profile.verified_experience.development_sessions.avg_turns_per_session, 1),
        "b": [b.id for b in profile.badges.earned],
        "sp": [[s.domain[:35], s.confidence] for s in profile.specialties[:3]],
        "mo": profile.tool_usage.models_used[:6],
        "pr": profile.verified_experience.project_count,
    }
    min_b64 = base64.urlsafe_b64encode(
        json.dumps(minimal, separators=(",", ":")).encode("utf-8")
    ).decode("ascii").rstrip("=")
    qr_url = f"https://aipassport.web.app/review#pmin={min_b64}"

    click.echo(f"\nProfile saved -> {out_path}  (read-only)")
    click.echo(f"AI Engineering Score: {profile.summary.ai_engineering_score}/100")
    click.echo(f"\nYour shareable passport URL:")
    click.echo(f"  {share_url}")

    if gen_qr:
        try:
            from .qr_art import generate_qr
            qr_path = out_path.parent / "passport_qr.png"
            generate_qr(
                qr_url, qr_path,
                name=name,
                score=profile.summary.ai_engineering_score,
            )
            click.echo(f"\nQR card saved -> {qr_path}")
        except ImportError:
            click.echo("\nQR generation requires: pip install 'qrcode[pil]'", err=True)
        except Exception as exc:
            click.echo(f"\nQR generation failed: {exc}", err=True)

    if open_browser:
        webbrowser.open(share_url)
