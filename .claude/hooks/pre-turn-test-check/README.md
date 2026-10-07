# Generic Claude Code Stop Verification Hook

This hook is a generic quality gate for Claude Code's `Stop` event.

Its job is intentionally narrow:

1. When Claude finishes a normal turn, run the project's configured or confidently detected verification command(s).
2. If verification fails, send the failure back to Claude and block the stop once.
3. Claude gets one chance to fix the problem.
4. If verification still fails on the next stop, allow the response to end and clearly report the unresolved failure.
5. If there are no tests or no verification target yet, do not pretend that verification passed. By default, allow the response with a visible "verification skipped" message.

## Important changes from the original version

- No automatic `npm install` / `npm ci`.
- No Node-only assumption.
- No failure merely because `package.json` has no `test` script.
- Explicit project verification can include tests, lint, type-check, build, database checks, etc.
- Optional project-specific setup is explicit and only runs when configured.
- State lives in the OS temp directory instead of `.claude/hooks/.state`.
- The Claude Code hook command uses `${CLAUDE_PROJECT_DIR}` and exec form so changing directories does not break the hook.
- Successful runs return a `systemMessage`, so the user can actually see that the hook ran. Claude Code intentionally hides ordinary successful hook stdout from the transcript.

## Setup

Put the following in the project:

```text
.claude/
  settings.json
  hooks/
    pre-turn-test-check/
      check-tests.mjs
    verification-target.json
```

Copy the examples:

```bash
cp verification-target.json.example .claude/hooks/verification-target.json
```

Then merge the `Stop` entry from `claude-code.settings.json.example` into `.claude/settings.json`.

Use `/hooks` inside Claude Code and confirm the hook appears under `Stop`.

Restart the session after changing settings if the hook does not appear.

## Project-specific verification

A project should configure `verification-target.json` once its actual validation workflow is known.

Example:

```json
{
  "checks": [
    {
      "name": "tests",
      "command": "docker compose exec app pytest",
      "workingDirectory": "."
    },
    {
      "name": "lint",
      "command": "npm run lint",
      "workingDirectory": "frontend"
    }
  ],
  "setupCommand": "docker compose up -d app db",
  "setupOnce": true,
  "requireVerification": true,
  "maxAttempts": 2,
  "timeoutMs": 120000
}
```

The hook does not guess how to start databases, services, migrations, emulators, containers, or special environments. Put that knowledge in the project configuration.

## What happens

### No tests yet

Allowed:

```text
ℹ️ Stop verification: no test/verification command is configured or confidently detectable.
The response was allowed.
```

### First failure

Claude is blocked from stopping and receives the failure:

```text
⚠️ Verification failed. Fix the reported issue and continue the task.
This is retry 1/2.
```

### Second failure

The hook stops the retry loop:

```text
❌ VERIFICATION STILL FAILING after 2 attempt(s).
The retry budget is exhausted, so the agent is stopping.
```

The important distinction is that "stopping after failure" is not reported as success.

## Why successful hooks may have looked invisible

Claude Code does not show ordinary successful command-hook stdout in the transcript. To make the result visible, this version returns a structured `systemMessage`.

For debugging hook execution itself:

- `/hooks` — confirm the hook is registered under `Stop`.
- `claude --debug-file /tmp/claude.log` — record hook execution details.
- `/debug` — enable debug logging in an already-running session.
- `Ctrl+O` — inspect the transcript view.

## Important Claude Code limitations

A `Stop` hook runs when the main agent has finished a normal response. It does not run when the stop was caused by a user interrupt, and API-error endings use `StopFailure` instead.

Per-turn hook behavior can also differ across Claude Code hosts/modes. Verify your actual runtime with `/hooks` and debug logging before assuming a missing message means the script did not run.

## Testing the hook itself

Run the script manually with a fake Stop payload:

```bash
echo '{"session_id":"test-session","hook_event_name":"Stop","stop_hook_active":false}' |
  node .claude/hooks/pre-turn-test-check/check-tests.mjs
```

A manual run tests the script; it does not prove Claude Code is invoking it.

Then verify the real event by running a normal Claude Code session and checking `/hooks` and the debug log.
