---
name: continuous-learning-v2
description: Instinct-based learning system that observes sessions via hooks, creates atomic instincts with confidence scoring, and evolves them into skills/commands/agents. v2.1 adds project-scoped instincts to prevent cross-project contamination. Use when configuring the instinct learning system, managing confidence-scored patterns, or evolving instincts into skills.
origin: ECC
version: 2.1.0
disable-model-invocation: true
---

# Continuous Learning v2.1 - Instinct-Based Architecture

An advanced learning system that turns your Claude Code sessions into reusable knowledge through atomic "instincts" -- small learned behaviors with confidence scoring.

**v2.1** adds **project-scoped instincts** -- React patterns stay in your React project, Python conventions stay in your Python project, universal patterns are shared globally.

## When to Activate

- Setting up automatic learning from Claude Code sessions
- Configuring instinct-based behavior extraction via hooks
- Tuning confidence thresholds for learned behaviors
- Reviewing, exporting, or importing instinct libraries
- Evolving instincts into full skills, commands, or agents
- Managing project-scoped vs global instincts

## Architecture Overview

```
Session Activity -> Hooks capture tool use (100% reliable)
  -> observations.jsonl (per-project or global)
  -> Pattern Detection (background, Haiku)
  -> Instincts (atomic, confidence-scored, scoped)
  -> /evolve clusters into skills/commands/agents
```

## Key Concepts

| Concept | Description |
|---------|-------------|
| Instinct | Atomic learned behavior: one trigger, one action, confidence-weighted |
| Scope | `project` (default) or `global` -- prevents cross-project contamination |
| Confidence | 0.3 tentative, 0.5 moderate, 0.7 strong, 0.9 near-certain |
| Promotion | Project instinct -> global when seen in 2+ projects with avg confidence >= 0.8 |
| Evolution | Cluster related instincts into full skills/commands/agents via `/evolve` |

## What's New in v2.1

| Feature | v2.0 | v2.1 |
|---------|------|------|
| Storage | Global only | Project-scoped + global |
| Detection | None | git remote URL / repo path |
| Promotion | N/A | Project -> global when seen in 2+ projects |
| Commands | 4 | 6 (+promote/projects) |
| Cross-project | Contamination risk | Isolated by default |

## Commands

| Command | Description |
|---------|-------------|
| `/instinct-status` | Show all instincts with confidence |
| `/evolve` | Cluster related instincts, suggest promotions |
| `/instinct-export` | Export instincts (filterable by scope/domain) |
| `/instinct-import <file>` | Import instincts with scope control |
| `/promote [id]` | Promote project instincts to global scope |
| `/projects` | List known projects and instinct counts |

## Privacy

- Observations stay local on your machine
- Project-scoped instincts are isolated per project
- Only instincts (patterns) can be exported -- not raw observations
- You control what gets exported and promoted

For detailed implementation, hook configs, file formats, and workflows, see references/implementation.md

## Related

- [Skill Creator](https://skill-creator.app) - Generate instincts from repo history
- Homunculus - Community project that inspired the v2 instinct-based architecture

---

*Instinct-based learning: teaching Claude your patterns, one project at a time.*
