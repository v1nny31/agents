# AGENTS.md

This file is the repository's baseline operating guide for AI coding agents.

`AGENTS.md` is guidance, not a security boundary or a guarantee of compliance. The agent must still verify its own work and obey higher-priority system, developer, and user instructions. Keep this file concrete, current, and focused on information an agent cannot reliably infer from the code alone.

More specific instructions may exist in nested `AGENTS.md` files. For a file being changed, follow the applicable root and nested instructions; when they conflict, the more specific applicable instruction takes precedence unless a higher-priority instruction says otherwise.

---

## 0. Non-Negotiable Agent Rules

These are the default behavioral constraints for every task.

1. **Do not guess when repository evidence is available.** Read the relevant code, configuration, tests, documentation, and package versions before relying on assumptions.
2. **Do not fabricate.** Never invent file paths, APIs, commands, library features, test results, commit hashes, configuration options, or successful outcomes.
3. **Do not make unrelated changes.** Solve the requested problem with the smallest coherent change.
4. **Do not declare success without evidence.** A task is not complete until the relevant verification has actually been run or the remaining manual verification is explicitly reported.
5. **Do not weaken safeguards to get a green result.** Never disable tests, security checks, type checks, linters, CI rules, hooks, or validation merely to make the task pass.
6. **Protect user work.** Do not overwrite or discard unrelated local changes. Do not use destructive Git or filesystem operations unless they are explicitly required and authorized.
7. **Follow the repository's existing conventions before introducing new ones.** Existing code, tests, configuration, and documentation are stronger evidence than personal preference.
8. **Stop and clarify when ambiguity materially changes the implementation.** When ambiguity is minor, state a reasonable assumption and proceed.

---

## 1. Instruction Hierarchy & Scope

### Priority

When instructions conflict, use this general order:

1. System/runtime safety constraints.
2. Developer/tooling instructions from the agent environment.
3. Direct user instructions.
4. The most specific applicable `AGENTS.md` instructions.
5. Broader/root `AGENTS.md` instructions.
6. General repository documentation and inferred conventions.

Never claim that `AGENTS.md` overrides a higher-priority instruction.

### File scope

An `AGENTS.md` file applies to its directory and descendants according to the agent/tool's supported discovery rules. In repositories that use nested instruction files, assume that local instructions extend the root rules and that more-specific instructions take precedence.

Before modifying files in an unfamiliar subtree, check for applicable nested instruction files unless the current agent environment has already explicitly loaded them.

### Keep instructions layered

The root `AGENTS.md` should contain project-wide rules. Put subsystem-specific guidance in narrower instruction files when the project/harness supports them. Do not duplicate the same rule in many places unless necessary.

---

## 2. Project Overview

Fill in the project-specific information below when creating a new project.

- **What this project is:** `[PROJECT-SPECIFIC: 1–3 sentence description]`
- **Main language(s):** `[PROJECT-SPECIFIC]`
- **Tech stack:** `[PROJECT-SPECIFIC: frameworks, runtimes, major tools]`
- **Entry points:** `[PROJECT-SPECIFIC]`
- **Key directories:** `[PROJECT-SPECIFIC]`
- **Architecture / important boundaries:** `[PROJECT-SPECIFIC]`
- **Project language:** `[PROJECT-SPECIFIC: documentation / team communication language]`
- **Supported environments:** `[PROJECT-SPECIFIC]`

Do not fill these fields by guessing. Inspect the repository first.

### Repository facts to verify

Before making substantial changes, inspect the sources that define how the project actually works, as applicable:

- `README.md` and relevant documentation
- package/build manifests (`package.json`, `pyproject.toml`, `Cargo.toml`, `pom.xml`, `composer.json`, etc.)
- lockfiles and runtime/version files
- CI workflows
- formatter/linter/type-check configuration
- test configuration and representative tests
- environment/configuration files
- existing architecture or contribution documents

---

## 3. Commands

Document the commands that are actually used by this project.

| Task | Command |
| --- | --- |
| Install dependencies | `[PROJECT-SPECIFIC]` |
| Run development server | `[PROJECT-SPECIFIC]` |
| Run tests | `[PROJECT-SPECIFIC]` |
| Run a single test | `[PROJECT-SPECIFIC]` |
| Lint | `[PROJECT-SPECIFIC]` |
| Format | `[PROJECT-SPECIFIC]` |
| Type-check | `[PROJECT-SPECIFIC]` |
| Build | `[PROJECT-SPECIFIC]` |

Use the project's real scripts/configuration rather than generic commands. If commands vary by package or directory, document that explicitly.

When a command is important to the task, run the exact project command rather than an approximate substitute whenever practical.

---

## 4. Structured Workflow

For anything beyond a trivial local edit, follow this workflow in order.

### Phase 1 — Understand

1. Read this `AGENTS.md` and any more-specific applicable instructions.
2. Read the user's request carefully and identify the actual desired outcome.
3. Inspect the relevant files, their callers/consumers, related tests, and relevant configuration.
4. Search for existing implementations or patterns before creating new ones.
5. Identify the project's source of truth for the behavior being changed.
6. Identify constraints, dependencies, affected interfaces, and likely edge cases.

Do not edit code during this phase.

### Phase 2 — Plan

For a non-trivial task, produce a concise implementation plan before making changes.

The plan should state:

- what will change
- which files or areas are likely to change
- important implementation choices
- how the result will be verified

Plans should be specific enough to review but short enough to remain useful.

If the request is straightforward and the change is clearly local, skip a formal plan and proceed.

### Phase 3 — Implement

1. Make the smallest change that fully satisfies the request.
2. Reuse existing utilities, patterns, components, helpers, and dependencies where appropriate.
3. Preserve unrelated behavior and public interfaces unless the task requires changing them.
4. Keep domain/business logic in the layer where the project expects it to live.
5. Do not introduce speculative features, abstractions, configurability, or refactors for future use.
6. Keep changes readable and consistent with nearby code.

If implementation reveals a significant requirement that was not understood during planning, stop and reassess before expanding scope.

### Phase 4 — Validate

Validation is part of implementation, not an optional final step.

Run checks in roughly this order:

1. targeted test/check for the changed behavior
2. targeted lint/type/static checks
3. broader relevant test suite
4. broader lint/type/build checks when appropriate
5. manual/UI verification when automation cannot prove the behavior

Fix failures rather than bypassing them.

### Phase 5 — Review

Before declaring the task complete:

1. Inspect the final diff.
2. Check for accidental changes.
3. Check for debug output, temporary files, generated artifacts, unused imports, dead code, and stale comments.
4. Search for affected call sites and consumers that may have been missed.
5. Confirm documentation/interfaces remain consistent.
6. Confirm only intended files changed.
7. Re-run the narrowest important verification after the final edit if the previous verification may have been invalidated.

### Phase 6 — Report

The final response must distinguish what was actually verified from what was merely recommended or requested from the user.

Report:

- what changed
- why the approach was chosen when non-obvious
- tests/checks actually run and their results
- manual checks performed or still required
- known limitations, assumptions, or follow-up items

Never say "everything works" unless the available evidence supports that claim.

---

## 5. Coding Norms

- **Simplicity first.** Prefer the simplest solution that is correct and maintainable.
- **Match existing style.** Follow established naming, file organization, error handling, and architectural patterns.
- **Single responsibility.** Keep functions/classes/modules focused enough to understand and test.
- **Separate concerns.** Keep business/domain logic, application orchestration, infrastructure, and presentation concerns separated according to the project's architecture.
- **Meaningful names.** Names should describe what something is or does.
- **No dead code.** Remove unused imports, unused variables, abandoned experiments, and commented-out code unless a project convention explicitly requires otherwise.
- **DRY with judgment.** Extract duplication when it creates a real maintenance problem; do not create abstractions for trivial repetition.
- **Comments explain why.** Prefer code that explains what it does; reserve comments for intent, constraints, trade-offs, or non-obvious behavior.
- **No premature optimization.** Optimize based on measured or clearly established requirements.
- **Use the configured formatter/linter.** Do not hand-format against project tooling.
- **Follow idiomatic language conventions.** Project configuration and established code take precedence over generic style preferences.
- **Document public APIs appropriately.** Follow the project's convention for public/exported functions, classes, modules, and interfaces.
- **Keep scope tight.** A feature request is not permission for an unrelated cleanup or refactor.

### Preferred vs. avoided patterns

When a project has a strong local convention, document concrete examples here instead of relying on vague rules.

```text
Preferred: [PROJECT-SPECIFIC EXAMPLE]
Avoid:    [PROJECT-SPECIFIC EXAMPLE]
Reason:   [WHY THE DIFFERENCE MATTERS]
```

---

## 6. Error Handling & Validation

- Validate untrusted or external data at system boundaries.
- Handle null/missing/invalid values deliberately.
- Consider empty collections, boundary values, malformed input, network/I/O failures, timeouts, concurrency, authorization, and partial failures where relevant.
- Catch specific errors where practical. Do not swallow unexpected errors.
- Preserve useful error context.
- Use meaningful user-facing or caller-facing error messages.
- Do not create broad error handling that hides real defects.
- Do not silently invent behavior for ambiguous requirements.

---

## 7. Testing Standards

- Test behavior and requirements, not internal implementation details.
- New behavior should normally include a happy path and meaningful failure/edge cases.
- Bug fixes should include a regression test when practical.
- Expected values should come from the requirement/specification or independently calculated expectations, not from the implementation under test.
- Do not delete, weaken, skip, or disable a test solely because it exposes a defect.
- Follow repository coverage requirements when they exist. Otherwise, prefer meaningful coverage over arbitrary percentages.
- Prefer targeted tests first, then the broader relevant suite.
- For changes with no automated test coverage, provide a clear manual verification procedure and report that automation did not cover the behavior.

### Test-data rule

Do not modify fixtures, snapshots, mocks, or expected outputs just to make a new implementation pass. First determine whether the implementation or expectation is wrong.

### UI rule

Automated unit/integration tests do not prove that real browser interactions, focus, mouse/keyboard behavior, layout, or visual output work correctly. Use real UI/browser tooling when available; otherwise report manual verification as a separate requirement.

---

## 8. Dependencies & Configuration

- Reuse an existing dependency before adding a new one when it can reasonably solve the problem.
- Before adding a dependency, verify that it exists, is compatible with the project version, and is appropriate for the problem.
- Do not add a dependency only for a trivial helper that the project can reasonably implement itself.
- Avoid changing dependency versions unless the task requires it.
- Treat lockfiles as important project state; update them using the project's package manager rather than editing them manually.
- Do not modify generated files manually when they are produced by a documented generator.
- Do not change build, CI, deployment, or environment configuration without understanding its consumers.
- When a configuration change is necessary, verify both the changed path and its downstream effects.

---

## 9. Git & Change Management

Follow the repository's existing Git workflow when one exists.

If no workflow is documented:

- avoid working directly on protected branches for non-trivial changes
- use a focused feature/fix branch where appropriate
- keep commits logically scoped if commits are requested
- use clear imperative commit messages
- do not commit secrets or machine-specific data

### Protected operations

Do not perform destructive or history-rewriting operations without explicit authorization when they could discard work or affect shared history. This includes, as applicable:

- force-pushes
- deleting branches
- resetting/discarding uncommitted user changes
- rewriting shared history
- deleting large sets of files
- destructive database operations
- broad automated replacements outside the requested scope

Before pushing or opening a PR, verify the working tree and final diff.

---

## 10. Security & Privacy

- Treat external/user-provided data as untrusted.
- Never hardcode secrets, passwords, tokens, private keys, or credentials.
- Never expose secrets through source code, logs, screenshots, tests, error messages, commits, or generated artifacts.
- Redact sensitive values during debugging.
- Do not weaken authentication, authorization, encryption, validation, or security controls merely to simplify implementation or testing.
- Prefer least privilege for permissions, service accounts, filesystem access, database access, and API scopes.
- Avoid insecure defaults when a secure alternative is practical.
- Review generated code and new dependencies rather than assuming they are safe.
- Do not place machine-specific absolute paths, personal usernames, internal hostnames, or local-only configuration into tracked project files unless required by the project.

---

## 11. Documentation & Source of Truth

`README.md` is generally for human-facing onboarding. `AGENTS.md` should contain the additional agent-facing context, constraints, and workflows that are useful during coding.

Prefer references to authoritative repository documents over duplicating large explanations.

When changing a public contract or important workflow, update the relevant documentation in the same change, including as applicable:

- API documentation
- CLI usage
- configuration documentation
- examples
- schemas/types
- architecture decisions
- user-facing setup instructions

When documentation and implementation disagree, identify which is authoritative before changing either.

### Durable learnings

When a task reveals a durable project rule, repeated failure mode, non-obvious architectural constraint, or required command, consider updating the appropriate project documentation or `AGENTS.md` so future agents do not rediscover it. Do not record temporary session details that will quickly become obsolete.

---

## 12. Hooks, CI & Automation

- Inspect relevant hooks, CI workflows, code generators, and automation before relying on them.
- A passing hook only proves the checks that hook actually ran.
- A passing unit-test suite does not prove the entire application works.
- Treat automation failures as real signals; fix the underlying problem rather than bypassing the automation.
- If automation changes files, inspect those changes before finishing.
- Do not claim CI passed unless you actually observed the result.

---

## 13. Stop Conditions & Escalation

The agent should stop editing and reassess when any of these occur:

- The task's requirements are materially ambiguous.
- The implementation would require a major architectural change not implied by the request.
- A required dependency or API cannot be verified.
- Existing tests and documented behavior disagree in a way that affects the requested change.
- A destructive operation appears necessary but is not clearly authorized.
- A security-sensitive behavior is being changed without sufficient context.
- The current approach is expanding substantially beyond the original scope.
- The agent has lost confidence in which behavior is correct.

When stopping, explain the specific uncertainty or conflict and the smallest decision needed to proceed.

---

## 14. Project-Specific Overrides

Replace this section with the project's concrete rules. Prefer rules that are specific, actionable, and not already guaranteed by tooling.

- **Domain source(s) of truth:** `[PROJECT-SPECIFIC]`
- **Architecture rules:** `[PROJECT-SPECIFIC]`
- **Required libraries/patterns:** `[PROJECT-SPECIFIC]`
- **Forbidden libraries/patterns:** `[PROJECT-SPECIFIC]`
- **Required tests/coverage:** `[PROJECT-SPECIFIC]`
- **Required quality gates:** `[PROJECT-SPECIFIC]`
- **Protected/generated files:** `[PROJECT-SPECIFIC]`
- **Required documentation:** `[PROJECT-SPECIFIC]`
- **Deployment/release requirements:** `[PROJECT-SPECIFIC]`
- **Definition of done:** `[PROJECT-SPECIFIC]`

### Project-specific examples

Use short examples when a rule is easy to misunderstand:

```text
Good: [PROJECT-SPECIFIC EXAMPLE]
Bad:  [PROJECT-SPECIFIC EXAMPLE]
Why:  [REASON]
```

Do not repeat generic rules from this file unless the project intentionally tightens them.

---

## 15. Communication

- Reply in the language of the user's request unless the project specifies another language.
- Be concise, but include the information necessary to review decisions and verification.
- For longer tasks, provide brief updates at meaningful milestones rather than narrating every command.
- Surface assumptions when they could affect the outcome.
- Distinguish clearly between **verified**, **requested manual verification**, and **not checked**.
- Never represent a recommendation as a completed check.

### Final-response format

Unless the user requests another format, finish coding tasks with:

**Result:** what changed.

**Files:** which files changed.

**Verification:** exact checks run and whether they passed or failed.

**Manual checks:** anything the user still needs to verify.

**Notes:** important assumptions, limitations, or follow-up items.

---

## 16. Definition of Done

Unless this project defines a stricter standard, a task is complete only when:

1. The requested behavior is implemented.
2. The implementation is limited to the requested scope.
3. Relevant tests were added or updated when appropriate.
4. Relevant automated checks were actually run and the result is known.
5. Relevant lint/type/build checks were run when applicable.
6. Public interfaces and documentation were updated when necessary.
7. No secrets or machine-specific data were introduced.
8. The final diff was reviewed.
9. No temporary/debug artifacts remain.
10. Remaining manual verification, uncertainty, or limitations are explicitly reported.

Do not equate “tests passed” with “the whole application works” when the tests do not cover the behavior in question.
