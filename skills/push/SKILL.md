---
name: push
description: "Push the current branch and open a pull request. Use whenever the user asks to push, publish the branch, or open a PR. Runs the checks, pushes without force, then creates the PR with a short title and a summary of every change in the branch, following the git rules in AGENTS.md."
---

# Push

Push the current branch and open a pull request into the project's base branch, with a short title and a summary of all the changes in the branch. This skill applies the git, checks, documentation, and communication rules of `AGENTS.md` (sections 3, 4, 6, and 7). Never force anything.

## Steps

1. **Guard the branch.** Run `git branch --show-current`. Stop and tell the user if the branch is one of the protected branches listed in the Git Workflow section of AGENTS.md, or if HEAD is detached.
2. **Require a clean tree.** Run `git status --short`. If anything is uncommitted, stop and suggest the `commit` skill first. Never push with pending changes.
3. **Determine the base branch.** Don't assume `main`. Check `git symbolic-ref refs/remotes/origin/HEAD` or `gh repo view --json defaultBranchRef`; if the project uses a different integration branch (e.g. `develop`), AGENTS.md's Git Workflow section should say so — ask the user if it's still unclear. Use this as `<base>` for the rest of the steps.
4. **Sync first.** AGENTS.md: pull before you push.
   - Run `git fetch origin`.
   - If the branch already exists on `origin` and has commits the local branch lacks, run `git pull --ff-only`. If that can't fast-forward, stop and ask the user. Never rebase or rewrite commits that were already pushed.
   - If `origin/<base>` has commits the branch lacks, report it as a limit and ask before merging or rebasing.
5. **List what will be published.** Run `git log --oneline origin/<base>..HEAD` and `git diff --stat origin/<base>...HEAD`. If nothing is ahead of `<base>`, say so and stop.
6. **Screen the range.** Publishing is hard to undo, so scan `git diff origin/<base>...HEAD` before pushing. Stop and ask if it adds a secret, a credential, an `.env` file, or a machine-specific path such as `C:\Users\...` or `/home/<user>/...`. A hit that is clearly documentation or an example is fine. Never push while a suspected secret is in the range.
7. **Run the checks that fit the changed files**, and report the command and result of each. Use the Lint, Type-check, Test, and Build commands from AGENTS.md's Commands table (section 2) for each language or subproject touched. If a documented public interface changed (API routes, exported functions, CLI commands) but its documentation wasn't updated in the same range, warn the user (AGENTS.md: keep docs in sync with interfaces). If a check fails, do not push — report the failure and ask whether to fix it or push anyway (AGENTS.md: never ignore a failing check silently).
8. **Push.** Use `git push -u origin <branch>` when there is no upstream, otherwise `git push`. Never use `--force`, `--force-with-lease`, `--delete`, or `--no-verify`. If the push is rejected, stop, report the reason, and ask.
9. **Open the pull request.**
   - Run `gh pr list --head <branch> --json url`. If a PR already exists, report its URL and stop; don't overwrite its description.
   - Otherwise run `gh pr create --base <base> --head <branch> --title "<title>" --body "<body>"`, passing the body through a here-string or heredoc so the formatting survives.
   - If `gh` is missing or not logged in, print the title and body for the user to paste, with the compare link `https://github.com/<owner>/<repo>/compare/<base>...<branch>` built from `git remote get-url origin`.

## Title and summary rules

AGENTS.md only asks for a PR description that summarizes what changed and why and links any related issue. The rest below fills the gaps.

- **Title:** short, at most 72 characters (same limit as a commit summary), imperative mood, no trailing period, describing the whole branch rather than its last commit. Use a Conventional Commits prefix only if `git log --oneline -10` already uses one.
- **Build the summary from the diff and every commit** in `origin/<base>..HEAD`, not from the last message alone. Under about 200 words, written in the project's language:
  - `## Summary`: one or two sentences saying what changed and why (AGENTS.md: document the why, not a restatement of the code).
  - `## Changes`: one short bullet per change, grouped by area. Every commit must be represented. Say "moved" for moves and renames instead of listing each file.
  - `## Validation`: the checks actually run with their result, and "not run" for anything skipped. Never write that something passes unless it was run in this session.
  - `## Related`: an issue link (`#123`) only if one appears in the branch name or commit messages. Never invent one, and omit the section otherwise.
- No secrets and no machine-specific paths in the title or body.
- If your tool or environment requires an attribution trailer, add it at the end of the body.

## Reply

Follow the communication rules of AGENTS.md: result first (pushed or not, and the PR link), then the title and summary used, the checks actually run (command and result, including any that failed before passing), and the remaining limits. Distinguish "executed" from "not run".

- Remind the user of the project's required review process before merging, if AGENTS.md's Project-Specific Overrides section defines one.
- If the range clearly mixes unrelated concerns, say so in one sentence (AGENTS.md: one logical change per PR) without blocking the push.
- Never merge the PR.
