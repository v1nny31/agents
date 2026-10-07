---
name: push
description: "Push the current branch and open a pull request. Use whenever the user asks to push, publish the branch, or open a PR. Commits pending changes through the commit skill, screens for secrets, runs the project's checks, pushes without force, then creates the PR through the create-pr skill."
---

# Push

Push the current branch and open a pull request into the base branch using the `create-pr` skill. Never force anything.

## Project rules come first

Before step 1, look for project instructions and let them override the defaults below: `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `.github/CONTRIBUTING.md`, and any `docs/` page about git workflow or CI. Use what they say about protected branches, the base branch for pull requests, required checks, and documentation that must change alongside code.

**Base branch.** The one the project rules name. Otherwise `develop` if `origin/develop` exists, else the repository's default branch (`git symbolic-ref --short refs/remotes/origin/HEAD`, or `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`). Call it `<base>` below and tell the user which one you used.

## Steps

1. **Guard the branch.** Run `git branch --show-current`. Stop and tell the user if HEAD is detached or the branch is protected (the project rules' list; by default `main`, `master`, `develop`, and the default branch).
2. **Commit pending changes first.** Run `git status --short`. If anything is uncommitted, follow the `commit` skill (`../commit/SKILL.md`) from its step 1, then run `git status --short` again. If the commit skill stops, or the user leaves some changes uncommitted, stop and report it. Never push with pending changes.
3. **Sync first.**
   - Run `git fetch origin`.
   - If the branch already exists on `origin` and has commits the local branch lacks, run `git pull --ff-only`. If that can't fast-forward, stop and ask the user. Never rebase or rewrite commits that were already pushed.
   - If `origin/<base>` has commits the branch lacks, report it as a limit and ask before merging or rebasing.
4. **List what will be published.** Run `git log --oneline origin/<base>..HEAD` and `git diff --stat origin/<base>...HEAD`. If nothing is ahead of `<base>`, say so and stop.
5. **Screen the range.** Publishing is hard to undo, so scan `git diff origin/<base>...HEAD` before pushing. Stop and ask if it adds a secret, a credential, an `.env` file, or a machine-specific path such as `C:\Users\...` or `/home/<user>/...`. A hit that is clearly documentation or an example is fine. Never push while a suspected secret is in the range.
6. **Run the checks that fit the changed files**, and report the command and result of each.
   - Use the checks the project rules or CI config name (`.github/workflows/*.yml`, `.gitlab-ci.yml`, etc. show what CI will run). Run each from the package root it belongs to (the nearest folder with `composer.json`, `package.json`, `pyproject.toml`, ...); a monorepo may have several.
   - Otherwise use what the project already has, for example:
     - PHP: `composer` scripts such as `lint`, `test`, `types`/`analyse`; else `vendor/bin/pint --test`, `vendor/bin/phpstan analyse` if configured, and `php artisan test --compact` (Laravel) or `vendor/bin/pest` / `vendor/bin/phpunit`.
     - JS/TS: the `lint`, `typecheck`/`types`, `test` and `build` scripts from `package.json`, run with the package manager the lockfile indicates.
     - Other stacks: their usual lint and test commands, only if configured.
   - If an area has no test command, say so instead of inventing one.
   - If routes, API controllers or public interfaces changed but the matching API documentation did not, warn the user.
   - If a check fails, do not push. Report the failure and ask whether to fix it or push anyway. Never ignore a failing check silently.
7. **Push.** Use `git push -u origin <branch>` when there is no upstream, otherwise `git push`. Never use `--force`, `--force-with-lease`, `--delete`, or `--no-verify`. If the push is rejected, stop, report the reason, and ask.
8. **Open the pull request** by following the `create-pr` skill (`../create-pr/SKILL.md`) from its step 1, with the same `<base>`. It reports the checks run in step 6 in its validation section. If the user only asked to push, offer the PR in one line instead.

## Reply

Result first (pushed or not, and the PR link), then the title and summary used, the checks actually run (command and result, including any that failed before passing), and the remaining limits. Distinguish "executed" from "not run".

- If the project rules set review requirements (number of reviewers, green CI before merge), remind the user of them in one line.
- If the range clearly mixes unrelated concerns, say so in one sentence without blocking the push.
- Never merge the PR.
