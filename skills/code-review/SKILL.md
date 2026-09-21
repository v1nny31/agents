---
name: code-review
description: "Review code changes (a diff, PR, branch, or path) for correctness, security, and adherence to this project's conventions before merging. Use whenever the user asks for a code review, to review a PR/branch/diff, or before merging into a protected branch."
---

# Code Review

Review the current diff (or the PR/branch/path given as an argument) for defects. Apply the general norms, error-handling, testing, and git rules in `AGENTS.md`, plus any project-specific conventions filled into AGENTS.md's Project-Specific Overrides (framework, stack, and domain rules) or the Project-specific checks section below.

## What to check

**Correctness**
- Logic bugs, off-by-one errors, unhandled edge cases (empty input, missing values, null/undefined).
- Code is wired together per the language/framework's own conventions (routing, request/response handling, model/entity relationships) rather than ad hoc patterns.

**Security**
- No unguarded mass-assignment or blind deserialization of user input into models/objects.
- Auth: routes/endpoints that should require authentication use the right middleware/guard; ownership checks exist on user-scoped resources (a user can't read/edit another user's data).
- Authorization logic is centralized (policies/guards/middleware) rather than duplicated as ad hoc `if` checks scattered through the code — flag duplicated inline authorization as a candidate to centralize.
- Input validation: every request path is validated before use — no raw, unvalidated input flowing into a query, file path, or response.
- No raw string-interpolated queries/commands; parameterized queries or the ORM/query builder used throughout.
- No credentials, API keys, or `.env` values committed (AGENTS.md, section 6).
- Data exposure: responses don't leak sensitive fields (passwords, tokens, internal flags) — check serialization/response shaping.

**Performance**
- No N+1 queries or per-iteration network/DB calls: relations/data accessed in a loop should be batched or eager-loaded.
- List endpoints/queries are paginated or bounded rather than returning unbounded result sets.
- New or changed columns/fields used in filters, joins, or sorting have appropriate indexes, if applicable.

**Error handling & responses**
- Exceptions/errors are handled centrally rather than swallowed with empty catch blocks or blanket suppression (AGENTS.md, section 4).
- Error responses use a consistent shape and correct status codes; internal error details/stack traces aren't leaked in production responses.
- Multi-step writes that must succeed or fail together are wrapped in a transaction, so partial failures don't leave inconsistent state.

**API / interface design**
- Endpoints/interfaces follow the project's own conventions (naming, verbs, request/response shape) as documented.
- Responses/return values are consistent and use sensible status codes or error types.
- Rate limiting/throttling is applied where appropriate for public or abuse-prone endpoints.
- Cross-origin/access configuration (if applicable) is scoped to known origins rather than wide open in production.

**Testing**
- New or changed behavior has corresponding tests (AGENTS.md, section 5); flag untested new endpoints/functions as a gap, not necessarily a blocker.
- Existing tests still pass and weren't modified just to make them pass without addressing the underlying behavior change.
- Tests cover at least one failure/edge case (invalid input, unauthorized access), not only the happy path.

**Migrations & data consistency** *(if the project has a schema/migrations)*
- Migrations are reversible, and any seed/default data is updated if defaults changed.
- Schema changes stay compatible with any other repo/service that depends on this schema — flag anything that looks like it will drift.

**Project conventions**
- Branch/commit hygiene matches AGENTS.md's Git Workflow section.
- New environment variables are added to an example/template env file with a safe placeholder, not just the developer's local config.
- Code follows the project's checkstyle/formatter cleanly (AGENTS.md, section 3), and lockfiles are committed when dependencies changed.
- New or changed public interfaces are documented in the same change (AGENTS.md: keep docs in sync with interfaces) — flag undocumented new routes/functions as a reminder, not necessarily a blocker.

## Project-specific checks

> [PROJECT-SPECIFIC — fill in once the stack is known: framework-specific security patterns (e.g. Laravel mass assignment/Policies, Django ORM, Rails strong params), a separate migrations/schema repo to keep in sync, required number of approvals before merging, branch-naming convention, etc.]

## Output

List findings ranked most-severe first: file:line, what's wrong, why it matters, and a suggested fix. Say explicitly if nothing significant was found — don't invent issues to pad the review. This review supplements human review, not replaces it; check AGENTS.md's Project-Specific Overrides for any required approval count before merging.
