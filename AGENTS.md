# AGENTS.md

This file gives any AI coding agent (Claude Code, Codex, Cursor, Copilot, Gemini CLI, Windsurf, Aider, Jules, Zed, etc.) standing instructions for this project. It's a general template — at the start of each new project, fill in the `[PROJECT-SPECIFIC]` sections below with the actual stack, commands, and structure. The agent should read this file first, and treat it as a baseline that can be extended (not overridden) by anything more specific said later in the conversation.

---

## 1. Project Overview

> [PROJECT-SPECIFIC — fill in per project]

- **What this project is:**
- **Tech stack:**
- **Entry point(s):**
- **Key directories:**

---

## 2. Commands

> [PROJECT-SPECIFIC — fill in per project]

| Task | Command |
|---|---|
| Install deps | |
| Run dev server | |
| Run tests | |
| Run a single test | |
| Lint | |
| Format | |
| Build | |
| Type-check | |

The agent should always use the project's actual scripts (e.g. from `package.json`, `Makefile`, `pyproject.toml`) rather than guessing generic commands.

If a command isn't defined yet (no test suite, linter, or CI), write "none" in its cell instead of filling in a framework default (e.g. PHPUnit/Pest/Pint, Jest, pytest), and add the real command once it exists.

---

## 3. General Coding Norms

- **Simplicity first.** Prefer the straightforward solution over the clever one. Don't add abstraction, config, or flexibility that isn't needed yet.
- **Match existing style.** Follow the conventions already in the codebase (naming, file layout, formatting) before applying personal/default preferences.
- **Small, focused functions/modules.** A function should do one thing. If a function is doing three things, it's probably three functions.
- **Separate concerns by layer.** Keep domain/business logic out of the UI/presentation layer — validation and business rules belong in models, services, or the backend, not in UI components. Keep domain logic, application logic (API/actions), and presentation (UI) as distinct layers.
- **Naming matters.** Names should say what something is or does, not how it's implemented. No single-letter variables outside tight loops/math.
- **No dead code.** Don't leave commented-out code, unused imports, unused variables, or TODOs without a linked issue/explanation.
- **DRY, but not obsessively.** Extract shared logic once it's duplicated 3+ times or the duplication is a real maintenance risk — not on the first repetition.
- **Comments explain *why*, not *what*.** The code should show what it does; comments are for intent, trade-offs, and non-obvious constraints.
- **Keep docs in sync with interfaces.** When a change affects a documented public interface (API routes, exported functions, CLI commands, config options), update the relevant documentation in the same change rather than as a follow-up.
- **No premature optimization.** Write clear code first. Optimize only when there's a measured, real bottleneck.
- **Dependencies are a cost.** Don't add a library for something that's a few lines of code, and don't add a new dependency at all without asking first. If approved, justify it briefly when adding it.
- **Keep functions/files a reasonable size.** If a file is sprawling past a few hundred lines or a function past ~40-50 lines, consider splitting it.
- **Consistent formatting.** Run the project's formatter/linter before considering work done — don't hand-format.
- **Respect the correct checkstyle for the language being used.** This includes, at minimum:
  - Correct, consistent indentation and bracing style for that language (e.g. 4 spaces for Python/PEP8, 2 spaces for JS/TS per the project's config, gofmt/rustfmt output for Go/Rust, etc.) — use the language/project's standard formatter rather than a personal default.
  - A doc comment/docstring for every function, method, and class (or at minimum every public/exported one) — describing purpose, parameters, return value, and any exceptions/errors raised.
  - Following the language's idiomatic naming conventions (e.g. `snake_case` in Python, `camelCase` in JS/Java, `PascalCase` for classes/types).
  - Conforming to the established style guide for that language/ecosystem (PEP8 for Python, Airbnb/Standard/ESLint config for JS/TS, `gofmt`/`golint` for Go, `rustfmt`/`clippy` for Rust, etc.), or the project's own linter config if one exists and takes precedence.

---

## 4. Error Handling & Checks

- **Fail loudly, not silently.** Never swallow exceptions/errors with an empty catch block. If an error is genuinely expected and handled, say so in a comment.
- **Validate inputs at boundaries.** Check arguments/payloads at the edges of the system (API handlers, CLI entry points, public functions) rather than trusting callers everywhere.
- **Handle the edge cases, explicitly:**
  - Empty / null / undefined values
  - Empty lists/arrays/collections
  - Off-by-one and boundary conditions (0, 1, max, max+1)
  - Network/IO failures and timeouts
  - Concurrent access / race conditions, where relevant
- **No bare `except:` / catch-all swallow.** Catch specific exceptions/errors; re-raise or log what you don't handle.
- **Meaningful error messages.** Errors should say what failed and, where possible, what to do about it — not just "Error" or a raw stack trace with no context.
- **Never ignore a failing test or a compiler/type warning** to make the build pass — fix the root cause or explicitly flag why it's being deferred.
- **Before declaring a task done, the agent should:**
  1. Run the relevant tests (or write new ones if none exist for the changed behavior).
  2. Run the linter/type-checker if the project has one.
  3. Actually read the diff once more for typos, leftover debug prints, and unused code.
  4. Confirm the change doesn't silently break an unrelated part of the code (search for other call sites).
  5. Remove temporary scripts, files, and logs, and confirm no file outside the request was modified.
- **Don't guess about behavior.** If it's unclear how something should behave in an edge case, ask, or state the assumption explicitly in a comment/commit message rather than silently picking one.

---

## 5. Testing

- The agent adds tests when explicitly asked to. When it does, or when it writes tests as part of a feature/fix, they must cover at least **90% coverage** of the code they target (line/branch coverage per the project's test-coverage tool). If the project already has a coverage tool/config, use it and report the resulting number; otherwise state clearly that coverage wasn't measured and why.
- New features get at least a basic test covering the happy path and one failure/edge case, in addition to meeting the 90% coverage bar above.
- Bug fixes should include a test that reproduces the bug before the fix, when practical.
- Don't delete, weaken, or disable a test, and don't alter test data, just to make it pass — fix the underlying code, or explain clearly why the test's expectation was wrong.
- **Write tests from the requirements, not from the implementation.** Compute expected values independently from the spec/domain rules; never derive them by running the function under test and pasting its output back as the expectation.
- **Validate narrow first, then wide.** Run the targeted test (single file or test name) before the full suite; then run the full test suite plus lint/type checks.
- If hitting 90% coverage isn't realistic for a given piece of code (e.g. trivial getters, unreachable defensive branches), say so explicitly rather than silently falling short or padding with low-value tests just to hit the number.

---

## 6. Git Workflow

- **Never commit or push directly to `main`/`master` (or any other protected/integration branch the project uses, e.g. `develop`, `staging`).** All changes go through a feature branch and a pull request, even for small changes.
- **Branch naming:** `type/short-description`, e.g. `feat/user-auth`, `fix/login-crash`, `chore/update-deps`, `docs/readme-update`.
- **One logical change per branch/PR.** Don't mix an unrelated refactor into a feature branch.
- **Commit messages:**
  - Short imperative summary line (≤ 72 chars), e.g. `Fix null pointer in session parser`.
  - Optional body explaining *why*, not just what, if the change isn't self-evident.
  - Follow [Conventional Commits](https://www.conventionalcommits.org/) style if the project already uses it (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`).
- **Commit atomically.** Each commit should leave the codebase in a working state; don't bundle unrelated changes into one commit.
- **Never commit secrets, API keys, `.env` files, or credentials.** Check `.gitignore` covers them before the first commit.
- **No machine-specific data in the repo.** Never write secrets, credentials, or paths specific to one machine (e.g. an absolute `C:\Users\...` or `/home/<user>/...` path) into repository files. Use relative paths, environment variables, or placeholders.
- **Pull before you push**, and rebase/merge cleanly rather than force-pushing over shared history (never force-push a shared/main branch).
- **Open a PR for review before merging**, even solo — use the PR description to summarize what changed and why, and link any related issue.
- **Don't merge your own PR with failing CI**, if CI is configured.
- **Keep PRs small and reviewable** where possible — prefer several small PRs over one giant one.
- **The agent should not run `git push --force`, delete branches, rewrite shared history, or push to `main` without explicit confirmation from me first.**
- **Fetch before assuming.** Run `git fetch` before assuming a branch does or doesn't exist — remote-tracking refs go stale between fetches.
- **Sync before the PR.** Before opening a PR, merge (or rebase, per the project's convention) the latest target branch into your branch and resolve conflicts locally.

---

## 7. Agent Behavior Expectations

- Ask a clarifying question if a request is ambiguous enough that guessing wrong would mean redoing real work — otherwise, state the assumption and proceed.
- **Read before proposing.** Read this file, then the files the task touches (rules, code, tests), before proposing any change.
- **Plan multi-file changes first.** For a change spanning several files, announce a brief plan before writing anything: which files, what each one is responsible for, and how it will be validated. For an obvious local change, just proceed.
- **Smallest coherent change.** Produce the smallest change that fully satisfies the request — minimal, targeted diffs rather than large rewrites unless a rewrite was explicitly requested. Don't add a dependency or a refactor that wasn't asked for; if one seems necessary, ask first.
- **Stay in scope.** Before concluding, re-read the diff, remove any temporary scripts, files, and logs, and confirm no file outside the request was touched.
- **Verify manually what tests can't prove.** For work that isn't fully covered by automated tests (e.g. UI/frontend interactions), manually exercise it — mouse/keyboard interaction, focus, messages, state after a full reload — rather than assuming the code is correct because it compiles.
- **Explain every decision and the reasoning behind it** — not just non-obvious changes. When presenting work, walk through: what was changed, why this approach was chosen over alternatives, what trade-offs it carries, and any assumptions made along the way. Don't just say "done" or hand over a diff with no explanation, but don't narrate details that have no consequence either.
- Surface trade-offs when there are multiple reasonable approaches, and explain why one was picked over the others, instead of silently choosing one and not mentioning the alternatives.
- When making a non-trivial design/architecture choice, state the reasoning in a code comment or the commit message as well, so the "why" survives outside the chat.
- Never invent APIs, library functions, or config options — verify they exist (via docs, the codebase, or installed package version) before using them.
- **Protect agent configuration.** Don't modify `AGENTS.md`, `CLAUDE.md`, or other agent/assistant configuration (rules, skills, hooks) unless explicitly asked to.

### Communication

- **Language.** Reply in the language of the user's message; file names, commands, and technical terms keep their original form.
- **Concision.** Be concise. For a multi-step task, give short progress notes at key moments: exploration, decision, difficulty, validation. Don't describe every read or command that has no consequence.
- **Uncertainty.** Flag any uncertainty that could change the scope or the outcome.
- **Final reply.** Start with the result, then the files modified, the validations actually run (command and result), and the remaining limitations.
- **Honesty about checks.** Never present a check that wasn't run as passed. Distinguish "executed", "observed manually", and "only recommended". If a check fails and then passes, report both results.

---

## 8. Project-Specific Overrides

> Add anything below that overrides or extends the general rules above for this specific project (e.g. a stricter style guide, a monorepo's cross-package rules, a required commit template, deployment steps, etc.)

-
