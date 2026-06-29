# AI Capability Passport

**The professional identity layer for AI-native engineers.**

AI engineering skill is real. It shows up in how you work — in session depth, tool discipline, workflow patterns, cache efficiency, and the consistency of your collaboration with AI systems over time. Until now, there has been no standard way to measure or communicate it.

AI Capability Passport generates a behavioral fingerprint of your AI engineering practice from session metadata — never from your prompts, never from your source code. It produces a structured, verifiable profile that reflects how you actually build with AI, not how you describe yourself.

```bash
npx ai-passport        # generates your profile and opens the viewer
```

**[View live → aipassport.web.app](https://aipassport.web.app)**

> *Screenshot: passport review page with score ring, verified experience metrics, and earned badges*

---

## The Problem

The tools developers use to represent themselves professionally were built for a different era.

**GitHub** shows what you have shipped. It captures output — repositories, commits, pull requests — but nothing about process. Two engineers can produce the same repository with radically different levels of competence and methodology.

**LinkedIn** shows where you have worked and what you claim to know. In the AI era, this gap is especially pronounced. "Proficient in AI" appears on thousands of profiles. It means nothing.

**Résumés** are entirely self-reported. They reflect the language someone uses to describe their experience, not the experience itself.

Meanwhile, AI engineering has become a genuine and differentiated skill. Developers who work effectively with AI systems — who understand context management, who structure agentic workflows, who develop the discipline to work in deep collaborative sessions with high cache efficiency — produce qualitatively different results than those who do not.

Employers know this. They have no standard way to evaluate it.

---

## What is AI Capability Passport?

AI Capability Passport is a behavioral fingerprint of your AI engineering practice.

It reads the session logs that Claude Code, Codex CLI, and other AI development tools produce locally on your machine. It extracts only behavioral metadata — tool invocation patterns, session timing, token efficiency, workflow depth — and uses that data to generate a structured capability profile.

The profile captures verified engineering behavior: how long you work in a single session, how efficiently you use context windows, how often you invoke agentic workflows, what your tool usage patterns look like across dozens of sessions. These signals are observable, consistent, and difficult to fabricate.

This is not another résumé builder. It does not ask you to describe your skills. It observes them.

---

## Trust Through Verification

Self-reported skills are easy to claim and impossible to verify. Behavioral signals are the opposite.

AI Capability Passport measures what is actually observable from session metadata:

| Behavioral Signal | What It Reflects |
|---|---|
| Sessions analyzed | Sustained practice over time, not a single project |
| Average active session duration | Depth of engagement per working session |
| Average turns per session | Complexity and iterative collaboration patterns |
| Cache efficiency | Context management discipline |
| Agentic tool usage | Comfort building multi-step automated workflows |
| Model diversity | Breadth of AI tooling adoption |
| Tool usage composition | Development methodology (read-heavy vs. write-heavy) |
| Debug iteration patterns | Systematic problem-solving behavior |
| Project breadth | Versatility across domains |

None of these signals require reading a single word you typed. They emerge from the structure of how you work, not the content of what you said.

The result is a profile grounded in evidence — the kind that holds up under scrutiny.

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

**The source code is fully open.** The extraction logic is in `passport/reader.py`. You can verify exactly what is and is not read before running anything.

---

## How It Works

**Stage 1 — Local extraction**

The `passport extract` command walks your AI tool session logs and builds a behavioral metrics file. For Claude Code, logs live at `~/.claude/projects/`. For Codex CLI, at `~/.codex/`. The extractor reads only structural metadata — tool names, token counts, timestamps — and emits a pure-numbers JSON file. This step requires no API key and no network access.

**Stage 2 — Profile generation**

The `passport generate` command sends your metrics file to the Claude API. The system prompt instructs the model to derive every score directly from the numbers provided and to mark any field null if the data is insufficient. Only aggregate behavioral metrics cross the network boundary.

**Stage 3 — Review and sharing**

You drag your `profile.json` onto aipassport.web.app. The React app renders your score, verified experience, specialty breakdown, and earned badges. You can share a self-contained URL (profile encoded in the URL fragment), download a 1080×1080 PNG share card, or post directly to X or LinkedIn.

---

## Why Developers Use It

**Credibility you can point to.** A profile backed by 141 days of session data and 22,000 tool invocations is a different kind of credential than a bullet point on a résumé.

**A public record of your practice.** Share a link to your passport on your GitHub profile, in your portfolio, or alongside a job application. Anyone with the link can view your full profile — no account required.

**Awareness of your own patterns.** Most developers have never seen their own tool usage composition, cache efficiency trend, or average session depth. The metrics are often surprising.

**A foundation for growth.** Recurring analysis shows how your patterns change. A rising cache efficiency score or deeper average session length reflects genuine skill development.

---

## Why Employers Care

AI engineering hiring is broken. Candidates claim fluency. Interviewers test syntax. Neither approach identifies the developers who have spent the last year building agentic systems, managing context windows with discipline, and shipping AI-integrated products to production.

A verified behavioral profile changes the signal-to-noise ratio.

An engineer with 86% cache efficiency across 100 sessions has demonstrably learned to structure AI collaboration efficiently. An engineer who runs Workflow and Agent tools in 70% of their sessions is building differently than one who only uses the editor. Session depth, tool composition, and project breadth tell a coherent story that no résumé bullet can replicate.

AI Capability Passport is designed to become the standard professional signal for AI-native engineering — the kind of credential that can appear on a job post as a requirement, not just a nice-to-have.

---

## What Gets Measured

All signals are derived from session metadata only. No content fields are ever accessed.

| Signal | Source | Confidence |
|---|---|---|
| Session count and frequency | Session timestamps | High |
| Active working time per session | Intra-session timing (30-min idle gap method) | High |
| Average turns per session | Turn counter | High |
| Cache efficiency | Token usage counters (cache read / total context) | High |
| Tool usage composition | Tool names only — not inputs or arguments | High |
| Agentic workflow depth | Agent, Workflow, Skill tool invocation counts | High |
| Model diversity | Model name field per message | High |
| Debug iteration patterns | Read→Exec→Read tool sequence detection | Medium |
| Refactoring discipline | Edit-to-Write invocation ratio | Medium |
| Domain specialties | Project folder names (filesystem paths, not content) | Medium |

**Intentionally omitted:** test coverage, documentation quality, task completion rate, code correctness. These cannot be derived from behavioral metadata without reading content. Fields that cannot be computed honestly are not computed.

---

## Quick Start

**Prerequisites**

| Requirement | Notes |
|---|---|
| Python 3.10+ | Required by the extractor and generator |
| Anthropic API key | Your own key — you pay for your own usage (~$0.05–0.20/run) |
| Claude Code or Codex session logs | Created automatically when you use those tools |

**Run**

```bash
# Set your API key
export ANTHROPIC_API_KEY=sk-ant-...        # Mac / Linux
$env:ANTHROPIC_API_KEY="sk-ant-..."        # Windows PowerShell

# One command via npm (installs Python package automatically on first run)
npx ai-passport

# Or install directly
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
passport run [--days 90] [--open] [--no-codex] [--output profile.json]

# Extract only — no API call, no network
passport extract [--days 90] [--output metrics.json]

# Generate from existing metrics file
passport generate --metrics metrics.json [--output profile.json]
```

| Flag | Default | Description |
|---|---|---|
| `--days` | 90 | Days of session history to include |
| `--open` | off | Open aipassport.web.app after generating |
| `--no-codex` | off | Skip Codex CLI sessions |
| `--output` | `profile.json` | Output file path |
| `--verbose` | off | Print each session file as it is read |

---

## Viewing and Sharing

Open [aipassport.web.app](https://aipassport.web.app) and drag your `profile.json` onto the page. Running `passport run --open` does this automatically.

From the review page:

- **Share on X** — opens a pre-filled draft with your score, key metrics, and a link to your passport
- **Share on LinkedIn** — copies your post text to clipboard and opens LinkedIn
- **Download PNG** — a 1080×1080 share card for any platform
- **Copy profile link** — a self-contained URL that encodes your full profile in the fragment. No server receives your data. Anyone with the link can view your passport without an account.

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

Issues and pull requests welcome. The roadmap includes support for Cursor, Gemini CLI, and other AI development tools as they expose session metadata.

---

## Project Philosophy

The software industry spent decades building tools to record what engineers produce. GitHub captures commits. Jira captures tickets. CI systems capture build results. All of it answers the same question: *what did you ship?*

AI-native engineering introduces a different question — one that output alone cannot answer. Two engineers can ship identical code with radically different levels of AI collaboration sophistication. The difference is not in the artifact. It is in the process.

**GitHub answers: "What have you built?"**

**LinkedIn answers: "Where have you worked?"**

**AI Capability Passport answers: "How do you build with AI?"**

This is the missing professional signal for the AI-native era. A verified, privacy-preserving, behavioral record of how an engineer actually works — not how they describe themselves.

---

*MIT License · [aipassport.web.app](https://aipassport.web.app) · [github.com/JJGIV2010/ai-passport](https://github.com/JJGIV2010/ai-passport)*
