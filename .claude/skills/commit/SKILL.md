---
name: commit
description: "Commit the working tree. Use whenever the user asks to commit, make a commit, or save changes to git. Screens for secrets, runs the project's fast format/lint checks, groups changes into atomic commits, and writes short messages (at most 20 words each). Never pushes."
---

# Commit

Commit every changed file with short messages. This skill never pushes.

## Project rules come first

Before step 1, look for project instructions and let them override the defaults below: `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `.github/CONTRIBUTING.md`, and any `docs/` page about git workflow. Use what they say about protected branches, commit message format, required checks, and files that must never be committed. When they are silent, use the defaults here.

## Steps

1. **Guard the branch.** Run `git branch --show-current`. Stop and tell the user if HEAD is detached or the branch is protected. Protected branches are the ones the project rules name; by default `main`, `master`, `develop`, and the repository's default branch (`git symbolic-ref --short refs/remotes/origin/HEAD`, if set). Offer to create a feature branch instead.
2. **List the changes.** Run `git status --short`. If there is nothing to commit, say so and stop. Untracked files count as changes.
3. **Screen the files before staging anything.** Do not stage, and ask the user, if any of these show up:
   - secrets or credentials: `.env` files (but `.env.example` is fine), private keys, tokens, credential JSON, or a local database file such as an untracked `*.sqlite`;
   - temporary leftovers: scratch scripts, logs, debug output, editor or OS files (`.DS_Store`, `*.swp`);
   - added lines (`git diff HEAD -U0`, plus the content of untracked files) that contain a secret or a machine-specific path such as `C:\Users\...` or `/home/<user>/...`. A hit that is clearly documentation or an example is fine.
   - Also suggest adding a `.gitignore` entry when a file plainly should never be tracked.
4. **Run the fast checks that fit the changed files**, and report the command and result of each.
   - Find the package root of each changed file: the nearest parent folder with `composer.json`, `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, etc. A monorepo can have several. Run each check from its package root.
   - Use the checks the project rules name. Otherwise pick the formatter/linter the project already has, for example:
     - PHP: `vendor/bin/pint --dirty` if Pint is installed, or a `lint`/`format` script from `composer.json`.
     - JS/TS: the `lint` script from `package.json`, run with the project's package manager (`pnpm`, `yarn`, `bun` or `npm`, chosen from the lockfile).
     - Python: `ruff check` / `ruff format` if configured; Go: `gofmt -l`; Rust: `cargo fmt --check`.
   - If no check is configured for a changed area, say so; never invent one.
   - A formatter may rewrite files; they get staged with the rest.
   - If a check fails, do not commit. Report the failure and ask whether to fix it or commit anyway. Never ignore a failing check silently.
   - This skill does not run the test suites. Never say tests passed unless they were run in this session.
5. **Group into logical changes.** One logical change per commit, each leaving the codebase working.
   - One cohesive change is the default: one commit.
   - Split only when files clearly belong to unrelated concerns (for example a bug fix and an unrelated docs edit).
   - Never split things that must ship together: code and its tests, a migration and its model, an API change and its API documentation, or a move/rename (the deletion and the addition go in the same commit).
   - Every changed file must end up in exactly one commit.
6. **Stage and commit each group.** For a single group, `git add -A`. For several groups, `git add -- <paths>` per group, then commit before staging the next.
7. **Verify.** Run `git status --short` (it must be clean, apart from files the user chose to leave out) and `git log --oneline -n <number of commits made>`.

## Message rules

- At most 20 words in total; shorter is better.
- First line at most 72 characters, imperative mood, e.g. `Add login form validation tests`. If a body is needed, separate it from the first line with a blank line and keep it within the 20 words. Use the body for a non-obvious *why*, not to restate the diff.
- Use a Conventional Commits prefix (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`) only if the project rules ask for it or `git log --oneline -10` already uses one.
- Write in the language the project rules require for commits; English if they don't say.
- No machine-specific paths, secrets, or claims that weren't verified (such as "tests pass").
- Any attribution trailer required by the environment (e.g. `Co-Authored-By:`) goes at the end and doesn't count toward the 20 words.
- Pass the message with `git commit -m`, one `-m` per paragraph. Never use `--no-verify`, `--amend`, or force flags. If a git hook fails, fix the cause and make a new commit.

## Reply

Result first, then the files committed, the checks actually run (command and result, and any that failed before passing), and the remaining limits. Distinguish "executed" from "not run". Keep it short.

- Give each commit's short hash and message.
- Don't push. Offer it in one line instead (the `push` skill does it).
