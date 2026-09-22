# pre-turn-test-check

A ready-made agent hook: before the agent's turn ends, rerun a configured
test command and give the agent a precise reason when it isn't passing,
instead of ever letting a failure or an "impossible to run" state read as
success. See `AGENTS.md` sections 7-8 for how this fits into the kit's
rules (a hook pass only confirms what it targets; it never substitutes for
manually verifying the frontend).

## Files

- `check-tests.mjs` — the hook script. Tool-agnostic: plain Node, no
  dependencies of its own.
- `claude-code.settings.json.example` — the Claude Code wiring (merge its
  `hooks` block into your project's `.claude/settings.json`, or
  `.claude/settings.local.json` for a personal-only hook that isn't
  committed for the whole team).
- `test-target.json.example` — copy to `test-target.json` next to this
  README and set the real test command once tests exist. Not required for
  the hook to work on a fresh project — see below.

## What it reports

| Situation | Category | Behavior |
|---|---|---|
| No `package.json` yet | not implemented | Allows the stop (nothing to test yet) |
| No real `test` script yet, or the configured test file doesn't exist | not implemented | **Blocks**, exact reason |
| `npm install`/`ci` fails, or output shows `Cannot find module` / `MODULE_NOT_FOUND` | dependency error | **Blocks**, includes the error tail |
| Test suite throws while loading (SyntaxError, "Cannot use import statement", ...) | code error | **Blocks**, flagged as distinct from a normal failing assertion |
| The test command can't even be launched | command error | **Blocks** |
| Tests run, some fail | test failure | **Blocks**, includes the failure output |
| Tests run, all pass | success | **Allows**, with an explicit note that only this target was verified — not the rest of the app |

In every non-success case it exits with code 2 and writes the reason to
stderr (Claude Code's Stop-hook convention for "keep going"); on success
or when standing down it exits 0.

## Configuring a real test target

```bash
cp test-target.json.example test-target.json
# edit "testCommand" inside it, e.g.:
#   "npm test -- tests/domaine/achats.test.js"
```

or override per-run with an environment variable instead:

```bash
CLAUDE_HOOK_TEST_CMD="npm test -- path/to/file.test.js" node hooks/pre-turn-test-check/check-tests.mjs
```

A Node script that invokes Vitest (or another runner) equivalently is
fine too — point `testCommand`/`CLAUDE_HOOK_TEST_CMD` at that script
instead of `npm test`.

On Windows/PowerShell, the script itself already calls `npm.cmd` (not
`npm`) for its own default commands, since a bare `npm` isn't reliably
resolved when Node spawns a process without a shell. If you supply a
fully custom `testCommand`, make sure it also works from PowerShell
directly.

## Loop guard

Blocking the stop makes the agent continue, which eventually hits `Stop`
again. To keep this bounded:

- The hook reads the Stop-hook `stop_hook_active` flag Claude Code sends
  on stdin (true = this is already a continuation caused by a previous
  block).
- It also keeps its own per-session attempt counter under
  `hooks/pre-turn-test-check/.state/`, capped by `CLAUDE_HOOK_MAX_ATTEMPTS`
  (default **2** real attempts — so a fix attempt actually gets
  re-checked once before the hook gives up).
- Once the cap is reached it **allows** the stop instead of blocking
  again, but still prints the last recorded failure, so a stand-down
  never reads as a quiet pass.

## Known activation conditions / limitations

- **Claude Code**: project-level hooks in `.claude/settings.json` require
  you to review and trust them before they run — Claude Code prompts for
  this. Review that prompt before enabling. Use `.claude/settings.local.json`
  instead if this should apply to you only, not the whole team/repo.
- The event this fires on is the **main agent's turn ending**, not a
  subagent's (that's a separate event where it exists at all).
- Other tools name this differently, or may not support an equivalent
  event at all (per AGENTS.md section 8's "hooks are tool-specific" note)
  — check your tool's own docs for its closest equivalent and adapt
  `claude-code.settings.json.example` accordingly; this script itself
  doesn't need to change.
- The test run has a timeout (`CLAUDE_HOOK_TIMEOUT_MS`, default 2 minutes)
  so a hang is reported as unresolved rather than stalling the agent
  indefinitely.
- The hook runs `npm ci`/`npm install` itself only when `node_modules/`
  is missing; still install dependencies yourself before the first real
  run so that run isn't spent installing.

## Verifying it's actually wired up

Running `node check-tests.mjs` by hand only proves the script's logic —
it does not prove your tool is actually calling it on the turn-ending
event (AGENTS.md section 8). Before relying on it:

1. **Success path** — with a real, passing test configured, run a normal
   session and confirm in the output that the hook ran and reported
   success before the turn ended.
2. **Failure path** — in a throwaway copy of the project, or via a
   controlled/reversible edit, break something the target test checks,
   run a session, and confirm the agent is actually forced to continue
   instead of the turn ending normally. Restore the project afterward.
