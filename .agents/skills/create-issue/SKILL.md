---
name: create-issue
description: "Create a GitHub issue in a strict, fully filled format. Use whenever the user asks to create, open, or file an issue, or accepts an offer to file one. Checks the gh connection first, uses the repository's own issue templates if it has them (else the bundled Bug, Feature, Documentation and Tech task templates), and fills every section."
---

# Create Issue

Create a GitHub issue from a template. Every issue follows its template exactly; no free-form descriptions.

## Project rules come first

Before step 1, look for project instructions and let them override the defaults below: `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `.github/CONTRIBUTING.md`. Use what they say about issue language, title format, ticket numbers, labels and branch naming.

- **Templates.** If the repository has Markdown issue templates in `.github/ISSUE_TEMPLATE/*.md`, use those. (YAML issue forms, `*.yml`, also count: turn each `body` field into a `## <label>` heading, in order, and use its `title`/`labels` keys.) Otherwise use the bundled ones in `templates/` next to this file.
- **Language.** The language the project rules require. Otherwise the language the chosen templates are written in. If the project requires a language the templates are not in, stop and offer to translate the templates first, as a separate change. Code, identifiers, file paths, commands, and labels always stay as they are.

## Steps

1. **Check the GitHub connection before anything else.**
   - Run `gh --version`, then `gh auth status`. On Windows with the repository inside WSL, `gh` may be installed on only one side; try both the Windows shell and WSL before concluding it is missing.
   - Get the repository from `git remote get-url origin` (as `<owner>/<repo>`) and pass it to every `gh` command with `-R <owner>/<repo>`, so `gh` doesn't depend on the current directory.
   - If `gh` is missing or not logged in, stop. Tell the user what failed and ask them to connect it: install `gh` if needed, then run `gh auth login`, or connect another tool that can create GitHub issues (e.g. a GitHub MCP server). Never fall back silently. Only if the user chooses it, give the filled-in title and body for them to paste instead.
2. **Look for a duplicate.** Run `gh issue list -R <owner>/<repo> --state all --search "<two or three keywords>"`. If a matching issue exists, show it and ask whether to use it instead.
3. **Pick the template.** With the bundled templates:

   | Template | Use for |
   | --- | --- |
   | `bug.md` | Something that doesn't work as it should, including behavior that contradicts a documented rule or spec. |
   | `feature.md` | New user-facing behavior or an enhancement. |
   | `documentation.md` | Missing, wrong, or outdated documentation. |
   | `tech-task.md` | Refactors, tests, dependencies, tooling, configuration: work with no new user-facing feature. |

   With repository templates, pick by each template's `name`/`about`. If the request fits none of them, or two equally, ask the user which one to use.
4. **Fill the template strictly.**
   - Keep every `##` heading of the template, with its exact wording and order. Add no other headings.
   - Replace all placeholder text (instructions, `'...'`, bracketed examples) with real content. A section with nothing to say gets `N/A`; never delete it.
   - The YAML front matter is for this skill only: don't copy it into the body.
   - No emojis. No secrets and no machine-specific paths (e.g. `C:\Users\...`, `/home/<user>/...`).
   - Write only what is known. Don't invent reproduction steps, environment details, or causes; ask the user, or write `N/A` and say so.
5. **Build the title.** The template's `title` prefix, unchanged, then a short summary: at most 72 characters in total, no trailing period, e.g. `[BUG]: Total ignores the discount on the checkout page`. If the user gives a ticket number, put it right after the prefix, in the format the user gave (e.g. `[FEATURE]: P1-55 Show tooltips on hover in the editor`).
6. **Check labels.** Run `gh label list -R <owner>/<repo> --limit 200`. Keep only the template's labels that exist. Don't create labels unless the user asks; mention any you skipped.
7. **Confirm before publishing.** Creating an issue publishes it. If the user explicitly asked to create this issue, go ahead. If the issue comes from an offer the agent made, show the title and body and wait for the user's confirmation.
8. **Create the issue.**
   - Write the body to a temporary file (in the scratchpad directory if there is one, else the system temp dir; never inside the repository) and pass it with `--body-file`, so quotes and non-ASCII characters survive the shell.
   - Run `gh issue create -R <owner>/<repo> --title "<title>" --body-file <file>`, adding `--label <label>` for each label kept in step 6. Add `--assignee` only if the user asks.
   - Delete the temporary file once the command succeeds.
   - If the command fails, report the error and stop. Don't retry in a loop.

## Reply

Result first (the issue URL), then the template used, the title, and the labels (and any skipped). If the issue goes with new work, offer in one line to create the matching branch, named per the project rules (by default `<type>/<issue-number>-<short-slug>`, e.g. `fix/42-checkout-discount`).
