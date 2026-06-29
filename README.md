# AI Capability Passport

A behavioral fingerprint of your AI engineering practice — generated from session metadata, never from content.

**[View your passport → aipassport.web.app](https://aipassport.web.app)**

---

## What it is

AI Capability Passport analyzes how you work with AI tools — not what you say to them. It reads session logs from Claude Code and Codex CLI, extracts behavioral signals (tool usage patterns, session depth, cache efficiency, agentic workflows), and generates a structured capability profile with a score, verified experience metrics, and earned badges.

The result is a shareable profile that reflects your actual AI engineering habits, not self-reported claims.

---

## Privacy — read this first

**Your prompts, source code, file contents, and file paths are never read, stored, or sent anywhere.**

Here is exactly what happens:

1. **Local extraction** — A Python script reads your session log files (`.jsonl`). It only reads: tool names (e.g. "Read", "Edit", "Bash"), token counts, timestamps, and model names. It explicitly skips all message content and all tool input fields (the file paths and code arguments). This step runs entirely on your machine.

2. **Metrics sent to Claude API** — The extractor produces a pure-numbers JSON file: turn counts, token totals, cache efficiency percentages, tool usage ratios. This is all that ever leaves your machine. No prompts. No code. No paths.

3. **Profile generated** — Claude API receives only those numbers and returns a structured capability profile. Your API key authenticates the request; it is never stored or shared.

4. **Web viewer** — `aipassport.web.app` is a static site. When you upload your `profile.json`, it is parsed entirely in your browser. Nothing is sent to any server. The shareable profile link encodes your profile in the URL fragment (`#p=...`) — fragments are never sent in HTTP requests.

The extraction code is fully open source in this repo. You can read exactly what is and is not accessed before running anything.

---

## Quick start

```bash
# Set your Anthropic API key (you need your own — see console.anthropic.com/keys)
export ANTHROPIC_API_KEY=sk-ant-...       # Mac / Linux
$env:ANTHROPIC_API_KEY="sk-ant-..."       # Windows PowerShell

# Run via npm (no install needed — installs Python package automatically on first run)
npx ai-passport

# Or install directly with pip
pip install ai-passport
passport run --open
```

Both commands extract your Claude Code sessions, generate your profile, and open `aipassport.web.app` — where you drag in the generated `profile.json` to view your passport.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Python 3.10+ | Required by the extractor and profile generator |
| Anthropic API key | Your own key from [console.anthropic.com/keys](https://console.anthropic.com/keys) — you pay only for your own usage (~$0.05–0.20 per run) |
| Claude Code session logs | Located at `~/.claude/projects/` — created automatically when you use Claude Code |

---

## How it works

```
Your machine                              Anthropic API
────────────────────────────────          ───────────────
~/.claude/projects/*.jsonl
        │
        ▼
  passport extract          ←── reads ONLY: tool names, token counts,
        │                        timestamps, model names
        │                        NEVER reads: prompts, code, file paths
        ▼
  metrics.json (numbers only)
        │
        └──────────────────────────────▶  Claude API
                                                │
                                                ▼
                                          profile.json
                                                │
                                         (stays local)
                                                │
                                   drag to aipassport.web.app
                                   (parsed in your browser)
```

---

## CLI reference

```bash
# Full pipeline — extract + generate + open browser
passport run [--days 90] [--open] [--no-codex] [--output profile.json]

# Extract only (no API call)
passport extract [--days 90] [--output metrics.json]

# Generate from existing metrics (API call only)
passport generate --metrics metrics.json [--output profile.json]
```

| Flag | Default | Description |
|---|---|---|
| `--days` | 90 | How many days of session history to include |
| `--open` | off | Open aipassport.web.app in your browser after generating |
| `--no-codex` | off | Skip Codex CLI sessions |
| `--output` | `profile.json` | Where to save the output |
| `--verbose` | off | Show each session file as it's read |

---

## Viewing and sharing your passport

After running, open [aipassport.web.app](https://aipassport.web.app) and drag your `profile.json` onto the page (or run with `--open` to launch it automatically).

From the review page you can:
- **Share on X** — opens a pre-filled draft with your score and stats
- **Share on LinkedIn** — copies your post text to clipboard, opens LinkedIn
- **Download PNG** — 1080×1080 share card for Instagram or anywhere else
- **Copy profile link** — a self-contained URL that anyone can open to view your full passport (no account needed, no data sent to any server)

---

## What gets measured

| Signal | Source | Confidence |
|---|---|---|
| Session count and frequency | Session timestamps | High |
| Active working time | Intra-session timing gaps | High |
| Cache efficiency | Token usage counters | High |
| Tool usage patterns | Tool names only (not inputs) | High |
| Agentic workflow depth | Agent/Workflow tool count | High |
| Model diversity | Model name field | High |
| Debug iteration patterns | Read→Exec→Read sequences | Medium |
| Refactoring discipline | Edit-to-Write ratio | Medium |
| Domain specialties | Project folder names (sanitized) | Medium |

Fields like test coverage, documentation quality, and task completion rate are intentionally omitted — they cannot be derived from metadata without reading content.

---

## Installation

**pip (recommended for repeated use)**
```bash
pip install ai-passport
passport run --open
```

**npx (no install needed)**
```bash
npx ai-passport
```
The npm shim checks for Python 3.10+, installs the `ai-passport` pip package on first run, then delegates to the Python CLI.

**From source**
```bash
git clone https://github.com/jjgiv/ai-passport
cd ai-passport
pip install -e .
passport run --open
```

---

## Contributing

Issues and PRs welcome. The core privacy contract — behavioral metadata only, never content — must be preserved in all contributions.

```
passport/
├── reader.py          # Claude Code session extractor
├── reader_codex.py    # Codex CLI session extractor  
├── metrics.py         # Aggregation across sessions
├── generator.py       # Claude API profile generation
├── schema.py          # Pydantic profile schema
└── cli.py             # Click CLI entry points

ui/                    # React + Vite web viewer (aipassport.web.app)
cli/                   # npm shim (npx ai-passport)
```

---

## License

MIT
