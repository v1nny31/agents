---
name: create-pr
description: "Create a GitHub pull request in a strict, fully filled format. Use whenever the user asks to open or create a PR for a branch that is already pushed; the push skill also uses it for its PR step. Checks the gh connection first, uses the repository's own PR template if it has one (else the bundled template.md), and fills every section."
---

# Create Pull Request

Open a pull request from the current branch into the base branch, with a description that follows the template exactly. This skill never pushes and never merges; use the `push` skill to push first.

## Project rules come first

Before step 1, look for project instructions and let them override the defaults below: `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `.github/CONTRIBUTING.md`, and any `docs/` page about git workflow. Use what they say about the base branch, protected branches, PR language, title format, labels, and review rules.

- **Base branch.** The one the project rules name, or the one the `push` skill passed in. Otherwise `develop` if `origin/develop` exists, else the repository's default branch (`gh repo view -R <owner>/<repo> --json defaultBranchRef -q .defaultBranchRef.name`). Called `<base>` below.
- **Template.** Use the repository's own template if it exists: `.github/pull_request_template.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `docs/pull_request_template.md`, `pull_request_template.md`, or the first file in `.github/PULL_REQUEST_TEMPLATE/`. Otherwise use `template.md` next to this file.
- **Language.** The language the project rules require. Otherwise the language the chosen template is written in. Code, identifiers, file paths, commands, labels and GitHub keywords (`Closes`) always stay as they are.

## Steps

1. **Check the GitHub connection before anything else.**
   - Run `gh --version`, then `gh auth status`. On Windows with the repository inside WSL, `gh` may be installed on only one side; try both the Windows shell and WSL before concluding it is missing.
   - Get the repository from `git remote get-url origin` (as `<owner>/<repo>`) and pass it to every `gh` command with `-R <owner>/<repo>`.
   - If `gh` is missing or not logged in, stop. Tell the user what failed and ask them to connect it: install `gh` if needed, then run `gh auth login`, or connect another tool that can create GitHub pull requests (e.g. a GitHub MCP server). Never fall back silently. Only if the user chooses it, give the filled-in title and body for them to paste, with the compare link `https://github.com/<owner>/<repo>/compare/<base>...<branch>`.
2. **Guard the branch.** Run `git branch --show-current`. Stop if HEAD is detached, if the branch is `<base>`, or if it is a protected branch (the project rules' list; by default `main`, `master`, `develop`).
3. **Require the branch on GitHub.** Run `git fetch origin`, then check that `origin/<branch>` exists and matches `HEAD`. If the branch isn't pushed, or local commits are missing from it, stop and suggest the `push` skill.
4. **Check for an existing PR.** Run `gh pr list -R <owner>/<repo> --head <branch> --json url`. If one exists, report its URL and stop; don't overwrite its description unless the user asks.
5. **Gather the content.** Read every commit in `git log --oneline origin/<base>..HEAD` and the diff from `git diff --stat origin/<base>...HEAD` (and the full diff where needed). If nothing is ahead of `<base>`, say so and stop.
6. **Fill the template strictly.**
   - Keep every `##` heading, with its exact wording and order. Add no other headings. A section with nothing to say gets `N/A`; never delete it.
   - Replace every placeholder (instructions, `'...'`, `<...>`, bracketed examples) with real content.
   - For the bundled `template.md`, the sections are:
     1. **Description:** one or two sentences on what changed and why, not a restatement of the code.
     2. **Related issue:** `Closes #<number>` for an issue found in the branch name, the commit messages, or given by the user. Keep the English keyword `Closes`, which GitHub needs to link and close the issue. Never invent one; write `N/A` if there is none.
     3. **Type of change:** tick every box that applies.
     4. **Changes:** one short bullet per change, grouped under a bold label per area the branch touches (e.g. **Backend**, **Frontend**, **Documentation**, **Tooling**; use the project's own top-level folders or packages as areas when that is clearer). Every commit must be represented. Say "moved" for moves and renames instead of listing each file.
     5. **How to test:** exact steps and the expected result for a reviewer, or `N/A` for a change with nothing to check by hand.
     6. **Validation:** each check actually run in this session, with its command and result, including any that failed before passing. Write "not run" for anything skipped. Never claim a check passed unless it was run.
     7. **Screenshots:** `N/A` unless the user provides some.
     8. **Checklist:** tick only items that are true. Leave review items unticked; reviewers tick them. Drop no item; an item that doesn't apply stays unticked with ` (N/A)` appended.
   - For a repository template, map the same information onto its sections.
   - No emojis. No secrets and no machine-specific paths. Keep the body under about 300 words.
   - End the body with the attribution line required by the environment, if any.
7. **Build the title.** At most 72 characters, imperative mood (in French, an infinitive, e.g. `Ajouter la validation du formulaire`), no trailing period, describing the whole branch rather than its last commit. Use a Conventional Commits prefix only if the project rules ask for it or `git log --oneline -10` already uses one.
8. **Pick labels.** Map each ticked type-of-change box to a label:

   | Box | Label |
   | --- | --- |
   | Bug fix | `bug` |
   | Feature | `enhancement` |
   | Documentation | `documentation` |
   | Tech task | `tech` |

   Run `gh label list -R <owner>/<repo> --limit 200` and keep only labels that exist. Don't create labels unless the user asks; mention any you skipped.
9. **Create the pull request.**
   - Write the body to a temporary file (in the scratchpad directory if there is one, else the system temp dir; never inside the repository) and pass it with `--body-file`, so quotes and non-ASCII characters survive the shell.
   - Run `gh pr create -R <owner>/<repo> --base <base> --head <branch> --title "<title>" --body-file <file>`, adding one `--label` per label from step 8.
   - Delete the temporary file once the command succeeds.
   - If the command fails, report the error and stop. Don't retry in a loop.

## Reply

Result first (the PR URL), then the base branch, the title, a short summary of the description, and the checks reported in it. If the project rules set review requirements (number of reviewers, green CI before merge), remind the user of them in one line. If the branch clearly mixes unrelated concerns, say so in one sentence. Never merge the PR.
