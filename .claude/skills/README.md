# Portable Claude skills

Drop the skill folders into a project's `.claude/skills/` folder (or `~/.claude/skills/` to have them in every project). Nothing needs editing: each skill detects the project's setup.

## Git / GitHub workflow (any stack)

| Skill | What it does |
| --- | --- |
| `commit` | Screens for secrets, runs the project's fast lint/format checks, makes short atomic commits. Never pushes. |
| `push` | Commits leftovers, syncs, screens, runs the project's checks, pushes without force, then opens a PR. |
| `create-pr` | Opens a fully filled PR. Uses the repo's own `.github/pull_request_template.md` if present, else `template.md`. |
| `create-issue` | Files a fully filled issue. Uses the repo's own `.github/ISSUE_TEMPLATE/` if present, else `templates/`. |

How they adapt:
- Project rules in `AGENTS.md`, `CLAUDE.md` or `CONTRIBUTING.md` override the defaults (protected branches, base branch, language, required checks, review rules).
- Base branch: `develop` if it exists, else the repo's default branch.
- Language: whatever the project rules say, else the language of the templates (bundled ones are English). To make a project French, put French templates in `.github/` or state it in `AGENTS.md`.
- Labels that don't exist in the repo are skipped, not created.
- Requires the GitHub CLI (`gh auth login`).

## Laravel stack

`laravel-best-practices`, `laravel-api-resource-patterns`, `testing-best-practices` (Pest or PHPUnit), `fortify-development`, `inertia-react-development` (Inertia v3), `wayfinder-development`, `tailwindcss-development` (v4, v3-aware), `deploying-to-cloud` (Laravel Cloud), `infer-conventions` (manual only: run `/infer-conventions`).

These check the installed versions/packages before applying anything. They use Laravel Boost's `search-docs` / `record-rule` tools when available and fall back to the official docs otherwise. Note: if you run `php artisan boost:install` in a project, Boost may regenerate its own copies of these same Laravel skills over these.
