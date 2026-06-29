# AI Capability Passport

**The professional identity layer for engineers who build with AI.**

GitHub shows what you've built.
LinkedIn shows where you've worked.
AI Capability Passport shows how you build with AI.

Generate a privacy-preserving profile from your AI engineering sessions using behavioral metadata — not prompts, source code, or proprietary data.

Everything is extracted locally. Nothing sensitive ever leaves your machine.

Works with Claude Code today, with support for additional AI development tools expanding over time.

```bash
npx ai-passport
```

**[View live → aipassport.web.app](https://aipassport.web.app)**

> *Screenshot: passport review page showing verified experience, session depth, tool usage, and earned badges*

---

## The Missing Professional Signal

The tools developers use to represent themselves professionally were built for a different era.

**GitHub** captures output — repositories, commits, pull requests. It answers *what you shipped*, not *how you work*.

**LinkedIn** captures self-reported history. In the AI era, this gap is especially pronounced. "Proficient in AI" appears on thousands of profiles. It means nothing.

**Résumés** are entirely self-reported. They reflect the language someone uses to describe their experience, not the experience itself.

Meanwhile, AI engineering has become a real and differentiated skill. Developers who understand context management, who structure multi-agent workflows, who have developed the discipline to work in deep collaborative sessions with high efficiency — they produce qualitatively different work than those who don't.

Employers increasingly need better ways to understand how candidates actually work with AI. There is no standard signal.

---

## What is AI Capability Passport?

AI Capability Passport is a behavioral profile of your AI engineering practice.

It reads the session logs that Claude Code, Codex CLI, and other AI development tools produce locally on your machine. It extracts observable engineering behavior — tool invocation patterns, session timing, token efficiency, workflow depth — and generates a structured capability profile from that data.

The profile captures verified engineering behavior across real sessions: how long you work, how efficiently you use context windows, how consistently you engage with agentic workflows, what your tool usage patterns look like over months of practice.

It doesn't ask what you know.

**It observes how you build.**

---

## Trust Through Verification

Self-reported skills are easy to claim and impossible to verify. Behavioral signals are the opposite.

A profile backed by 141 days of sessions and 22,173 tool invocations is a different kind of credential:

| | |
|---|---|
| **141** | Days of verified AI engineering activity |
| **104** | Sessions analyzed across Claude Code and Codex |
| **22,173** | Tool invocations — the observable record of real work |
| **6** | Integrations shipped (MCP servers, APIs, agents) |
| **86%** | Cache efficiency — a direct signal of context management discipline |

None of these signals require reading a single word you typed. They emerge from the structure of how you work, not the content of what you said.

Just as GitHub contribution graphs became social proof — a visual record that hiring managers reference in real interviews — AI Capability Passport is designed to become the equivalent for AI-native engineering practice.

---

## Privacy by Design

The privacy architecture is not a feature. It is the foundation.

**The extraction step runs entirely on your machine.**

```
Your machine                              Anthropic API
─────────────────────────────────         ─────────────
~/.claude/projects/*.jsonl
        │
        ▼
  passport extract
        │
        │  reads ONLY:
        │    • tool names (e.g. "Read", "Edit", "Bash")
        │    • token usage counters
        │    • timestamps
        │    • model names
        │
        │  never reads:
        │    • message content (your prompts)
        │    • tool inputs (file paths, code, arguments)
        │    • assistant responses
        │    • any string that could identify your work
        │
        ▼
  metrics.json  ←── pure numbers and labels only
        │
        └──────────────────────────────▶  Claude API
                                                │
                                                ▼
                                          profile.json
                                          (stays local)
                                                │
                                     drag to aipassport.web.app
                                     (parsed in your browser)
```

**What is sent to the Claude API:** turn counts, token totals, cache efficiency percentages, tool usage ratios, session timing, model names. Nothing else.

**What is never sent:** prompts, source code, file contents, file paths, tool arguments, assistant responses, or any content that could identify your projects or clients.

**The web viewer is a static site.** When you upload your `profile.json` to aipassport.web.app, it is parsed entirely in your browser. No data is transmitted to any server. The shareable profile link encodes your profile in the URL fragment — fragments are never included in HTTP requests.

**The source code is fully open.** The extraction logic lives in [`passport/reader.py`](passport/reader.py). You can verify exactly what is and is not read before running anything.

---

## How It Works

**Stage 1 — Local extraction**

`passport extract` walks your AI tool session logs and builds a behavioral metrics file. For Claude Code, logs live at `~/.claude/projects/`. For Codex CLI, at `~/.codex/`. The extractor reads only structural metadata — tool names, token counts, timestamps — and emits a pure-numbers JSON file. No API key. No network access.

**Stage 2 — Profile generation**

`passport generate` sends your metrics file to the Claude API. The model derives every field directly from the numbers provided and marks any field null if data is insufficient. Only aggregate behavioral metrics cross the network boundary.

**Stage 3 — Review and sharing**

Drag your `profile.json` onto aipassport.web.app. The viewer renders your verified experience, session depth, tool usage composition, specialty breakdown, and earned badges. Share a self-contained URL, download a PNG card, or post directly to X or LinkedIn.

---

## Why Developers Use It

**A professional record you own.** Your profile lives as a JSON file on your machine. You decide what to share, when, and with whom.

**Credibility that doesn't require explanation.** A link to a passport backed by months of session data communicates more than any résumé bullet. Engineers with strong profiles share them in portfolios, GitHub profiles, and job applications.

**Insight into your own patterns.** Most developers have never seen their cache efficiency, tool usage composition, or average session depth. The numbers are often surprising — and useful.

**A foundation for growth.** Run the analysis quarterly. Watch your patterns shift as your AI collaboration practice matures.

---

## Why Employers Care

As AI becomes part of everyday software engineering, employers increasingly need better ways to understand how candidates actually work with AI.

Interviews test syntax. Résumés report claims. Neither identifies the engineers who have spent a year building multi-agent systems, managing context windows with discipline, and shipping AI-integrated products to production.

Verified behavioral signals change this.

An engineer with 86% cache efficiency across 100+ sessions has demonstrably learned to structure AI collaboration efficiently. An engineer who invokes agentic workflow tools regularly is building at a different level of abstraction. Session depth, tool composition, and project breadth tell a coherent, evidence-backed story.

It's easy to imagine a future where job applications ask for a GitHub profile alongside an AI Passport.

---

## What Gets Measured

All signals are derived from verifiable development patterns — session metadata only. No content fields are accessed.

| Signal | Source | Confidence |
|---|---|---|
| Session count and frequency | Session timestamps | High |
| Active working time per session | Intra-session timing (30-min idle gap method) | High |
| Average turns per session | Turn counter | High |
| Cache efficiency | Token usage counters (cache read ÷ total context) | High |
| Tool usage composition | Tool names only — not inputs or arguments | High |
| Agentic workflow depth | Agent, Workflow, Skill tool invocation counts | High |
| Model diversity | Model name field per message | High |
| Debug iteration patterns | Read→Exec→Read tool sequence detection | Medium |
| Refactoring discipline | Edit-to-Write invocation ratio | Medium |
| Domain specialties | Project folder names (paths, not content) | Medium |

**Intentionally omitted:** test coverage, documentation quality, task completion rate, code correctness. These cannot be derived from behavioral metadata without reading content. Fields that cannot be computed honestly are not computed.

---

## Quick Start

**Prerequisites**

| Requirement | Notes |
|---|---|
| Python 3.10+ | Required by the extractor and generator |
| Anthropic API key | Your own key — ~$0.05–0.20 per analysis |
| Claude Code or Codex session logs | Created automatically when you use those tools |

**Run**

```bash
# Set your API key
export ANTHROPIC_API_KEY=sk-ant-...        # Mac / Linux
$env:ANTHROPIC_API_KEY="sk-ant-..."        # Windows PowerShell

# Via npm — no install needed, Python package installs automatically on first run
npx ai-passport

# Or install directly with pip
pip install ai-passport
passport run --open
```

**From source**

```bash
git clone https://github.com/JJGIV2010/ai-passport
cd ai-passport
pip install -e .
passport run --open
```

---

## CLI Reference

```bash
# Full pipeline — extract + generate + open browser
passport run [--days 90] [--open] [--qr] [--name "Your Name"] [--no-codex] [--output profile.json]

# Extract only — no API call, no network
passport extract [--days 90] [--output metrics.json]

# Generate from existing metrics file
passport generate --metrics metrics.json [--output profile.json]
```

| Flag | Default | Description |
|---|---|---|
| `--days` | 90 | Days of session history to include |
| `--open` | off | Open your passport in the browser after generating |
| `--qr` | off | Generate an artistic QR card PNG (`passport_qr.png`) |
| `--name` | — | Your name for the QR card footer |
| `--no-codex` | off | Skip Codex CLI sessions |
| `--output` | `profile.json` | Output file path |
| `--verbose` | off | Print each session file as it is read |

---

## Viewing and Sharing

After running `passport run --open`, the CLI prints a shareable URL and opens it directly in your browser — no drag-and-drop required:

```
AI Engineering Score: 87/100

Your shareable passport URL:
  https://aipassport.web.app/review#p=eyJtZXRhZGF0YS...

QR card saved -> passport_qr.png
```

Anyone with that link can view your full passport instantly. The profile is encoded in the URL fragment — no server receives your data, no account required to view.

**QR card** — run with `--qr` to generate a branded PNG card (`passport_qr.png`) suitable for resumes, business cards, and GitHub profiles. The QR encodes a compact mini-passport URL: scanning it opens a credential summary directly in the browser showing your score, sessions, badges, and specialties — no file upload needed.

```bash
passport run --open --qr --name "Your Name"
```

From the review page you can also:

- **Share on X** — opens a pre-filled draft with your key metrics and a link to your passport
- **Share on LinkedIn** — copies your post text to clipboard and opens LinkedIn
- **Download PNG** — a 1080×1080 share card for any platform
- **Copy profile link** — copies the shareable URL to clipboard

---

## Roadmap

**Currently supported**

- ✓ Claude Code
- ✓ Codex CLI

**Coming soon**

- Cursor
- Gemini CLI
- Cline
- Continue
- Roo Code
- Public Passport profiles
- Team dashboards
- Organization AI capability analytics
- Cryptographic verification — locally-signed attestations so employers know the profile was not manually edited

---

## Contributing

The privacy contract is the core invariant: behavioral metadata only, never content. All contributions must preserve it.

```
passport/
├── reader.py          # Claude Code session extractor
├── reader_codex.py    # Codex CLI session extractor
├── metrics.py         # Cross-session aggregation
├── generator.py       # Claude API profile generation
├── schema.py          # Pydantic profile schema
└── cli.py             # CLI entry points

ui/                    # React + Vite web viewer (aipassport.web.app)
cli/                   # npm shim (npx ai-passport)
```

Issues and pull requests are welcome.

---

## Project Philosophy

The software industry spent decades building tools to record what engineers produce. GitHub captures commits. CI systems capture build results. All of it answers the same question: *what did you ship?*

AI-native engineering introduces a different question — one that output alone cannot answer. Two engineers can produce identical code with radically different levels of collaboration sophistication. The difference is not in the artifact. It is in the process.

The AI era introduced a new professional skill.

Not writing prompts.
Not using chatbots.
Collaborating effectively with intelligent systems.

That skill deserves a professional identity.

---

**GitHub answers: "What have you built?"**

**LinkedIn answers: "Where have you worked?"**

**AI Capability Passport answers: "How do you build with AI?"**

---

AI Capability Passport is the professional identity layer for engineers who build with AI — a verifiable, privacy-preserving record of how you actually work, not how you describe yourself.

---

*MIT License · [aipassport.web.app](https://aipassport.web.app) · [github.com/JJGIV2010/ai-passport](https://github.com/JJGIV2010/ai-passport)*
