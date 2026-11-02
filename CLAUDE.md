@AGENTS.md

<!-- Claude Code-only notes go below this line. Keep shared rules in AGENTS.md; don't duplicate or let this drift from it. -->

## Skills

Project skills live in `.agents/skills/`, so other agents can share them. Claude Code only discovers skills in `.claude/skills/`, so the entries there for those skills are generated links back to `.agents/skills/`.

- Add and edit these skills in `.agents/skills/`, not through `.claude/skills/`.
- Run `node .agents/link-claude-skills.mjs` after adding or removing a skill, or if a skill is missing in a fresh clone.

## Code intelligence

When setting up a project, or when a project starts using a new language, follow `.agents/code-intelligence.md` to check for the language server plugin each language needs.
