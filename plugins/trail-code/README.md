# Trail-Code

[Trail-Code on GitHub](https://github.com/trailhq/Trail-Code) gives coding agents a map of the codebase and saved learnings about its decisions and behavior.

**Use it for:** any project.

**Needs:** Node 22.3 or newer (20.16 also works).

## Install

1. Install the CLI. Do this once per machine, not once per project:

   ```
   npm install -g @trailhq/trail-code
   ```

2. Set it up in each project, from that project's root:

   ```
   trail init
   ```

3. Commit the generated setup, plus any instruction files it added a section to (such as `AGENTS.md`):

   ```
   git add .claude .mcp.json .trail .gitignore .ignore
   ```

## Before you run `trail init`

- **Run it in the new project, not in this kit.** It adds a section to `AGENTS.md`, which would then get copied into every new project.
- **It also changes user-level config**, such as `~/.claude/settings.json`, which affects every repo you open with that agent. Use `trail init --no-global` to skip those changes, or `trail init --dry-run` to see what it would write first.
