# agent-starter-kit

A drop-in set of AI coding agent rules and skills. Copy this into the root of any new project so that Claude Code, Codex, Cursor, Copilot, Gemini CLI, Windsurf, Aider, and other agents all follow the same coding norms, error-handling standards, testing bar, and git workflow — with a couple of ready-made skills for committing, pushing, and reviewing code.

## What's inside

```
.
├── AGENTS.md                    # the source of truth: rules for any agent
├── CLAUDE.md                    # 1-line shim so Claude Code also reads AGENTS.md
└── skills/
    ├── commit/SKILL.md          # stage, screen, and commit changes atomically
    ├── push/SKILL.md            # push + open a PR with a proper summary
    └── code-review/SKILL.md     # review a diff/PR for correctness, security, perf
```

### `AGENTS.md`

The single file every agent reads first. Covers:

- **Project overview & commands** — placeholders to fill in per project (stack, entry points, install/test/lint/build commands).
- **General coding norms** — simplicity, naming, DRY, layering, checkstyle, docs-in-sync-with-code.
- **Error handling & checks** — fail loudly, validate at boundaries, a pre-"done" checklist.
- **Testing** — 90% coverage minimum on tests written, tests derived from the spec (not from the implementation), narrow-then-wide validation.
- **Git workflow** — no direct commits/pushes to protected branches, branch naming, atomic commits, no secrets or machine-specific paths, no force-pushing.
- **Agent behavior expectations** — read before proposing, plan multi-file changes, smallest coherent diff, explain every decision and trade-off, stay in scope, verify manually what tests can't cover.
- **Communication norms** and a **Project-Specific Overrides** section for anything unique to one repo.

### `CLAUDE.md`

Claude Code looks for `CLAUDE.md` specifically rather than `AGENTS.md`. This file is just:

```
@AGENTS.md
```

...plus a spot to add Claude Code–only notes without duplicating (or drifting from) the shared rules.

### `skills/`

Each folder is a self-contained skill an agent can invoke:

| Skill | Use it to... |
|---|---|
| `commit` | Stage, screen for secrets/temp files, and commit the working tree in small, atomic commits with short messages. Never pushes. |
| `push` | Sync, run the project's checks, push the branch (no force), and open a PR with a structured summary. Never merges. |
| `code-review` | Review a diff, PR, branch, or path for correctness, security, performance, error handling, API design, testing, and project-convention issues. |

All three defer to `AGENTS.md` for anything project-specific (protected branches, lint/test commands, required approvals) instead of hardcoding a stack.

## Quick start

1. Copy `AGENTS.md`, `CLAUDE.md`, and `skills/` into the root of your new project.
2. Fill in `AGENTS.md`:
   - **Section 1 (Project Overview)** — what the project is, tech stack, entry points, key directories.
   - **Section 2 (Commands)** — the actual install/dev/test/lint/build commands.
   - **Section 8 (Project-Specific Overrides)** — anything that overrides or extends the defaults (a stricter style guide, a monorepo split, required review counts, deployment steps, etc.).
3. If your project has more than one stack (e.g. a separate backend/frontend), split section 2's commands table by subproject, and note it in section 8.
4. Fill in the `code-review` skill's **Project-specific checks** placeholder once your framework/stack is known (e.g. Laravel Policies, Django ORM patterns, a linked migrations repo).
5. Place `skills/*` wherever your agent expects skills to live (for Claude Code, typically `.claude/skills/<name>/SKILL.md`).

## Notes

- Keep `AGENTS.md` as the one place project rules live — edit it, not the individual skills, when a rule changes.
- The skills intentionally never push to a protected branch, force-push, or merge a PR on their own; those actions always need your explicit go-ahead.
- Don't let an agent modify `AGENTS.md`, `CLAUDE.md`, or the skills themselves without being asked — that's called out directly in `AGENTS.md` section 7.
