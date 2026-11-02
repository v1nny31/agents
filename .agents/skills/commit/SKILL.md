---
name: commit
description: "Commit the working tree. Use whenever the user asks to commit, make a commit, or save changes to git. Stages every changed file and writes short commit messages (at most 20 words each), following the git and checks rules in AGENTS.md."
---

# Commit

Commit every changed file with short messages. This skill applies the commit-related rules of `AGENTS.md` (sections 3, 4, 6, and 7). It never pushes.

## Steps

1. **Guard the branch.** Run `git branch --show-current`. Stop and tell the user if the branch is one of the protected branches listed in the Git Workflow section of AGENTS.md (never commit directly there) or if HEAD is detached.
2. **List the changes.** Run `git status --short`. If there is nothing to commit, say so and stop. Untracked files count as changes.
3. **Screen the files before staging anything.** Do not stage, and ask the user, if any of these show up:
   - secrets or credentials: `.env` files, keys, tokens, or an untracked database file (AGENTS.md: never commit them);
   - temporary leftovers: scratch scripts, logs, debug output (AGENTS.md: remove them before concluding);
   - added lines (`git diff HEAD -U0`, plus the content of untracked files) that contain a secret or a machine-specific path such as `C:\Users\...` or `/home/<user>/...`. A hit that is clearly documentation or an example is fine.
4. **Run the checks that fit the changed files**, and report the command and result of each. Use the Lint / Format / Type-check commands from AGENTS.md's Commands table (section 2) for each language or subproject touched by the change; in a monorepo, run each affected subproject's own commands.
   - If a check fails, do not commit. Report the failure and ask whether to fix it or commit anyway (AGENTS.md: never ignore a failing check silently).
   - This skill does not run the test suites. Never say tests passed unless they were run in this session.
5. **Group into logical changes.** AGENTS.md wants atomic commits: one logical change per commit, each leaving the codebase working.
   - One cohesive change is the default: one commit.
   - Split only when files clearly belong to unrelated concerns (for example an unrelated docs edit alongside a fix).
   - Never split things that must ship together: code and its tests, a migration and its model, an interface/API change and its documentation, or a move/rename (the deletion and the addition go in the same commit).
   - Every changed file must end up in exactly one commit.
6. **Stage and commit each group.** For a single group, `git add -A`. For several groups, `git add -- <paths>` per group, then commit before staging the next.
7. **Verify.** Run `git status --short` (it must be clean) and `git log --oneline -n <number of commits made>`.

## Message rules

- At most 20 words in total; shorter is better.
- First line at most 72 characters, imperative mood, e.g. `Add input validation to the signup form`. If a body is needed, separate it from the first line with a blank line and keep it within the 20 words. Use the body for a non-obvious *why*, not to restate the diff.
- Use a Conventional Commits prefix (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`) only if `git log --oneline -10` already uses one.
- Written in the project's language (see AGENTS.md's Communication section). No machine-specific paths, secrets, or claims that weren't verified (such as "tests pass").
- Any attribution trailer required by your tool or environment (e.g. a `Co-Authored-By:` line) goes at the end and doesn't count toward the 20 words.
- Pass the message with `git commit -m`, one `-m` per paragraph. Never use `--no-verify`, `--amend`, or force flags. If a git hook fails, fix the cause and make a new commit.

## Reply

Follow the communication rules of AGENTS.md: result first, then the files committed, the checks actually run (command and result, and any that failed before passing), and the remaining limits. Distinguish "executed" from "not run". Keep it short.

- Give each commit's short hash and message.
- Don't push. AGENTS.md requires the user's explicit confirmation before pushing; offer it in one line instead.
