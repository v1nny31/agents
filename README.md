# agent-starter-kit

A drop-in set of AI coding agent rules, skills, and hooks. Copy this into the root of any new project so that Claude Code, Codex, Cursor, Copilot, Gemini CLI, Windsurf, Aider, and other agents all follow the same coding norms, error-handling standards, testing bar, and git workflow — with a couple of ready-made skills for committing, pushing, and reviewing code, plus an optional hook that keeps the agent from claiming tests pass when they don't (or can't even run).

## What's inside

```
.
├── AGENTS.md                    # the source of truth: rules for any agent
├── CLAUDE.md                    # shim so Claude Code also reads AGENTS.md, plus where skills live
├── skills-lock.json             # records where third-party skills were installed from
├── .agents/
│   ├── link-claude-skills.mjs   # links .agents/skills/ into .claude/skills/ for Claude Code
│   ├── code-intelligence.md     # which language server plugin each language needs
│   ├── skills/
│   │   ├── commit/SKILL.md      # stage, screen, and commit changes atomically
│   │   ├── push/SKILL.md        # push + open a PR with a proper summary
│   │   ├── code-review/SKILL.md # review a diff/PR for correctness, security, perf
│   │   └── design-taste-frontend/ # third-party frontend design skill
│   └── hooks/
│       └── pre-turn-test-check/ # reruns a configured test command before the
│                                # agent's turn ends; reports precisely why it
│                                # isn't passing instead of ever faking success
├── .claude/skills/              # generated links, so Claude Code can find the skills
└── plugins/                     # one install guide per plugin; not copied into projects
```

### `AGENTS.md`

The single file every agent reads first. Covers:

- **Project overview & commands** — placeholders to fill in per project (stack, entry points, install/test/lint/build commands).
- **General coding norms** — simplicity, naming, DRY, layering, checkstyle, docs-in-sync-with-code.
- **Error handling & checks** — fail loudly, validate at boundaries, a pre-"done" checklist.
- **Testing** — tests derived from the spec (not from the implementation), narrow-then-wide validation.
- **Git workflow** — no direct commits/pushes to protected branches, branch naming, atomic commits, no secrets or machine-specific paths, no force-pushing.
- **Agent behavior expectations** — read before proposing, plan multi-file changes, smallest coherent diff, explain every decision and trade-off, stay in scope. Automated tests passing is treated as necessary but not sufficient: for UI/frontend work the agent either exercises it itself (with real browser tooling) or hands the user a precise manual test script and explicitly asks them to confirm — it never claims "everything works" on the user's behalf.
- **Communication norms**, including distinguishing a check the agent executed, one it observed manually, one it only asked the user to try, and one that's merely recommended.
- **Hooks** — how to treat an agent hook if the project has one (a hook's pass only confirms what it targets, never the whole app; don't route around a failing hook) and a pointer to the ready-made one in `.agents/hooks/`.
- A **Project-Specific Overrides** section for anything unique to one repo.

### `CLAUDE.md`

Claude Code looks for `CLAUDE.md` specifically rather than `AGENTS.md`. This file starts with:

```
@AGENTS.md
```

...followed by Claude Code–only notes, such as where skills live, without duplicating (or drifting from) the shared rules.

### `.agents/skills/`

Each folder is a self-contained skill an agent can invoke:

| Skill | Use it to... |
|---|---|
| `commit` | Stage, screen for secrets/temp files, and commit the working tree in small, atomic commits with short messages. Never pushes. |
| `push` | Sync, run the project's checks, push the branch (no force), and open a PR with a structured summary. Never merges. |
| `code-review` | Review a diff, PR, branch, or path for correctness, security, performance, error handling, API design, testing, and project-convention issues. |
| `design-taste-frontend` | Design landing pages, portfolios, and redesigns that don't look templated. Third-party, from [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill). |

`commit`, `push`, and `code-review` defer to `AGENTS.md` for anything project-specific (protected branches, lint/test commands, required approvals) instead of hardcoding a stack.

Claude Code only discovers project skills in `.claude/skills/`, so `.agents/link-claude-skills.mjs` creates a link there for each skill. The links are specific to each machine, so git ignores them. Rerun the script whenever you add or remove a skill.

### `.agents/hooks/`

| Hook | Use it to... |
|---|---|
| `pre-turn-test-check` | Rerun a configured test command right before the agent's turn ends, and report precisely *why* it isn't passing — not implemented, dependency error, code error, or a real test failure — instead of ever turning that into a false success. Ships wired for Claude Code's `Stop` event; the script itself is plain Node and portable to another tool's equivalent event. |

This is optional: skip the folder entirely for a project that doesn't want a pre-turn check. See `.agents/hooks/pre-turn-test-check/README.md` for wiring, configuration, its loop guard, and how to actually verify it fires (both passing and failing) rather than just running the script by hand.

## Quick start

1. Copy `AGENTS.md`, `CLAUDE.md`, `skills-lock.json`, and `.agents/` into the root of your new project. Skip `.agents/hooks/` if you don't want the hook. Don't copy `.claude/skills/`; step 5 creates it.
2. Fill in `AGENTS.md`:
   - **Section 1 (Project Overview)** — what the project is, tech stack, entry points, key directories.
   - **Section 2 (Commands)** — the actual install/dev/test/lint/build commands.
   - **Section 9 (Project-Specific Overrides)** — anything that overrides or extends the defaults (a stricter style guide, a monorepo split, required review counts, deployment steps, etc.).
3. If your project has more than one stack (e.g. a separate backend/frontend), split section 2's commands table by subproject, and note it in section 9.
4. Fill in the `code-review` skill's **Project-specific checks** placeholder once your framework/stack is known (e.g. Laravel Policies, Django ORM patterns, a linked migrations repo).
5. For Claude Code, run `node .agents/link-claude-skills.mjs` from the project root so it can find the skills. Run it again after cloning the project on another machine. If another agent doesn't read `.agents/skills/`, point it at that folder using its own config.
6. If you're keeping `.agents/hooks/pre-turn-test-check`, wire it into your tool (for Claude Code: merge `claude-code.settings.json.example` into `.claude/settings.json`) once real tests exist, then verify it actually fires in both a passing and a failing case — see that folder's README.
7. Install the plugins that fit the project — see [Plugins](#plugins).
8. Add [Ponytail's rules](plugins/ponytail/README.md) to the end of the project's `AGENTS.md`. They must be added to the existing file, not replace it.

## Plugins

These aren't included in this kit, so each one has to be installed separately. Follow the install guide for each plugin the project needs.

| Plugin | Use it for | Needs a CLI? | Install guide |
|---|---|---|---|
| [Trail-Code](https://github.com/trailhq/Trail-Code) | Any project | Yes | [plugins/trail-code](plugins/trail-code/README.md) |
| [godot-claude-skills](https://github.com/alexmeckes/godot-claude-skills) | Godot 4.x projects | Only for the optional godot-mcp server | [plugins/godot-claude-skills](plugins/godot-claude-skills/README.md) |
| [i-have-adhd](https://github.com/ayghri/i-have-adhd) | Any project, for shorter, action-first responses | No | [plugins/i-have-adhd](plugins/i-have-adhd/README.md) |
| [Ponytail](https://github.com/dietrichgebert/ponytail) | Any project, for writing less code | No | [plugins/ponytail](plugins/ponytail/README.md) |
| [agent-skills](https://github.com/addyosmani/agent-skills) | Any project, for engineering workflow skills | No | [plugins/agent-skills](plugins/agent-skills/README.md) |
| [OpenAI Docs MCP](https://developers.openai.com/learn/docs-mcp?setup=claude-code) | Projects that build on OpenAI's APIs | Needs the `claude` CLI | [plugins/openai-docs-mcp](plugins/openai-docs-mcp/README.md) |
| [Code intelligence](https://code.claude.com/docs/en/plugins/code-intelligence) | Any language with a plugin; each language has its own | No, but each needs a language server binary | [.agents/code-intelligence.md](.agents/code-intelligence.md) |

The code intelligence guide lives in `.agents/` rather than `plugins/` because it gets copied into each project. Claude Code uses it there to work out which plugins that project's languages need.

## Notes

- Keep `AGENTS.md` as the one place project rules live — edit it, not the individual skills, when a rule changes.
- The skills intentionally never push to a protected branch, force-push, or merge a PR on their own; those actions always need your explicit go-ahead.
- Don't let an agent modify `AGENTS.md`, `CLAUDE.md`, or the skills/hooks themselves without being asked — that's called out directly in `AGENTS.md` section 7.
