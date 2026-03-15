---
name: prompt-optimizer
description: >-
  Analyze raw prompts, identify intent and gaps, match ECC components
  (skills/commands/agents/hooks), and output a ready-to-paste optimized
  prompt. Advisory role only — never executes the task itself.
  TRIGGER when: user says "optimize prompt", "improve my prompt",
  "how to write a prompt for", "help me prompt", "rewrite this prompt",
  or explicitly asks to enhance prompt quality. Also triggers on Chinese
  equivalents: "优化prompt", "改进prompt", "怎么写prompt", "帮我优化这个指令".
  DO NOT TRIGGER when: user wants the task executed directly, or says
  "just do it" / "直接做". DO NOT TRIGGER when user says "优化代码",
  "优化性能", "optimize performance", "optimize this code" — those are
  refactoring/performance tasks, not prompt optimization.
origin: community
metadata:
  author: YannJY02
  version: "1.0.0"
context: fork
---

# Prompt Optimizer

Analyze a draft prompt, critique it, match it to ECC ecosystem components,
and output a complete optimized prompt the user can paste and run.

## When to Use

- User says "optimize this prompt", "improve my prompt", "rewrite this prompt"
- User says "help me write a better prompt for..."
- User says "what's the best way to ask Claude Code to..."
- User pastes a draft prompt and asks for feedback or enhancement
- User says "I don't know how to prompt for this"
- User explicitly invokes `/prompt-optimize`

### Do Not Use When

- User wants the task done directly (just execute it)
- User says "optimize this code", "optimize performance" -- these are refactoring tasks
- User is asking about ECC configuration (use `configure-ecc` instead)
- User wants a skill inventory (use `skill-stocktake` instead)

## How It Works

**Advisory only -- do not execute the user's task.**

Run a 6-phase pipeline sequentially:

| Phase | Purpose |
|-------|---------|
| Phase 0 | Project Detection -- detect tech stack from project files |
| Phase 1 | Intent Detection -- classify task category |
| Phase 2 | Scope Assessment -- estimate complexity (TRIVIAL to EPIC) |
| Phase 3 | ECC Component Matching -- map to commands/skills/agents |
| Phase 4 | Missing Context Detection -- identify gaps in the prompt |
| Phase 5 | Workflow & Model Recommendation -- lifecycle placement |

## Output Format

| Section | Content |
|---------|---------|
| 1. Prompt Diagnosis | Strengths, issues table, clarification questions |
| 2. Recommended ECC Components | Commands, skills, agents, model |
| 3. Optimized Prompt (Full) | Complete, self-contained, copy-paste ready |
| 4. Optimized Prompt (Quick) | Compact version for experienced users |
| 5. Enhancement Rationale | What was added and why |

For detailed phase descriptions, tables, and examples, see references/analysis-pipeline.md

## Related Components

| Component | When to Reference |
|-----------|------------------|
| `configure-ecc` | User hasn't set up ECC yet |
| `skill-stocktake` | Audit which components are installed |
| `search-first` | Research phase in optimized prompts |
| `blueprint` | EPIC-scope optimized prompts (invoke as skill, not command) |
| `strategic-compact` | Long session context management |
| `cost-aware-llm-pipeline` | Token optimization recommendations |
