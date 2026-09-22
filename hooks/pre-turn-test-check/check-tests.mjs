#!/usr/bin/env node
/**
 * Generic pre-turn-end test-check hook (part of the agent-starter-kit).
 *
 * Wired to Claude Code's "Stop" event by default (see
 * claude-code.settings.json.example in this folder); the script itself is
 * plain Node with no tool-specific dependency, so it can be pointed at
 * whatever event another tool uses for "about to finish a turn/response".
 *
 * Purpose
 * -------
 * Fires on the Stop event (the point just before the agent's turn ends).
 * It runs the project's real test command and reports back to the agent
 * with a PRECISE reason when things are not green, distinguishing:
 *
 *   1. tests_not_implemented  - no test script / no test file yet
 *   2. dependency_error       - npm install / module resolution failed
 *   3. code_error             - the test file(s) could not even load
 *                               (syntax/runtime error), separate from a
 *                               normal assertion failure
 *   4. test_failure           - tests ran, at least one assertion failed
 *   5. success                - tests actually ran and passed
 *
 * It never turns 1-4 into a false "success". On success it explicitly
 * scopes the claim to what was tested, it does not claim the whole
 * application was verified.
 *
 * Loop guard
 * ----------
 * A Stop hook that blocks makes Claude Code continue the turn, which will
 * eventually hit Stop again. To avoid an unlimited retry loop this script:
 *   - honors the tool-provided `stop_hook_active` flag (true = this is
 *     already a continuation caused by a previous block), and
 *   - keeps its own small per-session attempt counter as a second,
 *     tool-independent safety net (CLAUDE_HOOK_MAX_ATTEMPTS, default 2).
 * Once the cap is hit, the hook stops blocking (lets the turn end) but it
 * still prints the last recorded failure so it stays visible instead of
 * silently vanishing.
 *
 * Configuration (all optional)
 * -----------------------------
 *   CLAUDE_HOOK_TEST_CMD     full command line to run, e.g.
 *                            "npm test -- tests/domaine/achats.test.js"
 *   CLAUDE_HOOK_TEST_FILE    just the test file path; the script builds
 *                            "npm test -- <file>" from it
 *   CLAUDE_HOOK_MAX_ATTEMPTS how many times to actually re-run tests and
 *                            block on failure before standing down (default 2)
 *   CLAUDE_HOOK_TIMEOUT_MS   kill the test process after this long,
 *                            default 120000 (2 min), so a hang doesn't
 *                            block Claude Code forever
 *
 * The same options can be set in test-target.json (next to this script)
 * instead of env vars, e.g.:
 *   { "testCommand": "npm test -- tests/domaine/achats.test.js" }
 *
 * With nothing configured, on a base project this will almost always
 * resolve to "tests_not_implemented", which is expected and reported
 * as such (not as an error in the hook itself).
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// CWD is wherever the tool invokes this hook from (normally the project
// root) - that's where tests actually run. Config and per-session state
// live next to the SCRIPT ITSELF instead, so this folder stays portable
// regardless of where a given tool expects hooks to live (.claude/hooks/
// for Claude Code, somewhere else for another tool).
const CWD = process.cwd();
const HOOKS_DIR = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(HOOKS_DIR, "test-target.json");
const STATE_DIR = path.join(HOOKS_DIR, ".state");

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function readStdinJSON() {
  try {
    const raw = fs.readFileSync(0, "utf8");
    if (!raw || !raw.trim()) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function loadConfig() {
  let fileCfg = {};
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      fileCfg = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    } catch (e) {
      // A broken config file is itself worth surfacing, but it should not
      // crash the hook silently into a false pass.
      fileCfg = { __configError: String(e.message || e) };
    }
  }
  return {
    testCommand: process.env.CLAUDE_HOOK_TEST_CMD || fileCfg.testCommand || null,
    testFile: process.env.CLAUDE_HOOK_TEST_FILE || fileCfg.testFile || null,
    maxAttempts: Number(process.env.CLAUDE_HOOK_MAX_ATTEMPTS || fileCfg.maxAttempts || 2),
    timeoutMs: Number(process.env.CLAUDE_HOOK_TIMEOUT_MS || fileCfg.timeoutMs || 120000),
    configError: fileCfg.__configError || null,
  };
}

function npmBin() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function safeMkdirState() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
}

function stateFile(sessionId) {
  return path.join(STATE_DIR, `${sessionId || "default"}.json`);
}
function failureFile(sessionId) {
  return path.join(STATE_DIR, `${sessionId || "default"}.last-failure.txt`);
}

function readAttempts(sessionId) {
  try {
    return JSON.parse(fs.readFileSync(stateFile(sessionId), "utf8")).attempts || 0;
  } catch {
    return 0;
  }
}
function writeAttempts(sessionId, n) {
  safeMkdirState();
  fs.writeFileSync(stateFile(sessionId), JSON.stringify({ attempts: n, ts: Date.now() }));
}
function clearAttempts(sessionId) {
  try {
    fs.unlinkSync(stateFile(sessionId));
  } catch {}
  try {
    fs.unlinkSync(failureFile(sessionId));
  } catch {}
}
function persistFailure(sessionId, msg) {
  safeMkdirState();
  fs.writeFileSync(failureFile(sessionId), msg);
}
function lastFailure(sessionId) {
  try {
    return fs.readFileSync(failureFile(sessionId), "utf8");
  } catch {
    return "(no prior failure recorded)";
  }
}

function runShell(commandLine, timeoutMs) {
  return spawnSync(commandLine, {
    cwd: CWD,
    encoding: "utf8",
    shell: true,
    timeout: timeoutMs,
  });
}

// exit 0 = let the turn stop. exit 2 = block the stop, stderr is fed back
// to the agent as the reason it must keep working.
function allow(message) {
  console.log(message);
  process.exit(0);
}
function block(sessionId, message) {
  persistFailure(sessionId, message);
  console.error(message);
  process.exit(2);
}

// ---------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------

function main() {
  const input = readStdinJSON();
  const sessionId = input.session_id || "default";
  const stopHookActive = input.stop_hook_active === true;
  const { testCommand, testFile, maxAttempts, timeoutMs, configError } = loadConfig();

  if (configError) {
    // Malformed config is reported, not swallowed.
    return block(
      sessionId,
      `[check-tests hook] CONFIG ERROR: .claude/hooks/test-target.json could not be parsed: ${configError}`
    );
  }

  // --- Loop guard -------------------------------------------------------
  // Primary signal: our own per-session attempt counter. Secondary safety
  // net: if the tool tells us this is already a hook-driven continuation
  // (stop_hook_active) but our counter somehow reads 0 (e.g. state dir
  // was wiped), treat it as at least one prior attempt rather than
  // trusting a suspiciously-fresh counter.
  const rawAttempts = readAttempts(sessionId);
  const attemptsSoFar = stopHookActive ? Math.max(rawAttempts, 1) : rawAttempts;
  if (attemptsSoFar >= maxAttempts) {
    const note = lastFailure(sessionId);
    return allow(
      `[check-tests hook] Standing down after ${attemptsSoFar} attempt(s) to avoid an infinite retry loop.\n` +
        `This stop is being ALLOWED so the agent is not stuck, but tests were never confirmed passing.\n` +
        `Last recorded issue (still unresolved unless fixed since):\n${note}`
    );
  }

  // --- Resolve what to run --------------------------------------------
  const pkgPath = path.join(CWD, "package.json");
  if (!fs.existsSync(pkgPath)) {
    return allow(
      `[check-tests hook] TESTS NOT IMPLEMENTED: no package.json at the project root yet - ` +
        `nothing to test in this base project. Not blocking the stop for a project that hasn't started.`
    );
  }

  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  } catch (e) {
    writeAttempts(sessionId, attemptsSoFar + 1);
    return block(sessionId, `[check-tests hook] CODE ERROR: package.json is not valid JSON: ${e.message}`);
  }

  let commandLine;
  let label;
  if (testCommand) {
    commandLine = testCommand;
    label = testCommand;
  } else if (testFile) {
    if (!fs.existsSync(path.join(CWD, testFile))) {
      writeAttempts(sessionId, attemptsSoFar + 1);
      return block(
        sessionId,
        `[check-tests hook] TESTS NOT IMPLEMENTED: configured test file "${testFile}" does not exist yet.`
      );
    }
    commandLine = `${npmBin()} test -- ${testFile}`;
    label = `npm test -- ${testFile}`;
  } else {
    const hasRealTestScript =
      pkg.scripts &&
      pkg.scripts.test &&
      !/no test specified/i.test(pkg.scripts.test);
    if (!hasRealTestScript) {
      writeAttempts(sessionId, attemptsSoFar + 1);
      return block(
        sessionId,
        `[check-tests hook] TESTS NOT IMPLEMENTED: package.json has no real "test" script yet ` +
          `(still missing or the default npm placeholder). Add one, or set CLAUDE_HOOK_TEST_CMD / ` +
          `.claude/hooks/test-target.json to point at the intended test command, before this hook ` +
          `can actually verify anything.`
      );
    }
    commandLine = `${npmBin()} test`;
    label = "npm test";
  }

  // --- Dependencies -----------------------------------------------------
  if (!fs.existsSync(path.join(CWD, "node_modules"))) {
    const hasLock = fs.existsSync(path.join(CWD, "package-lock.json"));
    const installCmd = `${npmBin()} ${hasLock ? "ci" : "install"}`;
    const install = runShell(installCmd, timeoutMs);
    if (install.error) {
      writeAttempts(sessionId, attemptsSoFar + 1);
      return block(
        sessionId,
        `[check-tests hook] DEPENDENCY ERROR: could not even run "${installCmd}" (${install.error.message}). ` +
          `Is npm installed and on PATH?`
      );
    }
    if (install.status !== 0) {
      writeAttempts(sessionId, attemptsSoFar + 1);
      const tail = `${install.stdout || ""}\n${install.stderr || ""}`.trim().slice(-1500);
      return block(
        sessionId,
        `[check-tests hook] DEPENDENCY ERROR: "${installCmd}" failed, so tests could not be attempted.\n\n${tail}`
      );
    }
  }

  // --- Run tests ----------------------------------------------------
  const result = runShell(commandLine, timeoutMs);

  if (result.error) {
    // e.g. ENOENT: the command itself could not be launched
    writeAttempts(sessionId, attemptsSoFar + 1);
    return block(
      sessionId,
      `[check-tests hook] COMMAND COULD NOT RUN: "${label}" failed to start (${result.error.message}). ` +
        `Check that the tool it depends on (npm, node, vitest, ...) is installed and on PATH.`
    );
  }
  if (result.signal === "SIGTERM" && timeoutMs) {
    writeAttempts(sessionId, attemptsSoFar + 1);
    return block(
      sessionId,
      `[check-tests hook] "${label}" was killed after exceeding the ${timeoutMs}ms timeout. ` +
        `Treat this as unresolved, not as a pass - either the tests hang or something is much slower than expected.`
    );
  }

  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  const category = classify(output, result.status);
  const tail = output.trim().slice(-2000);

  if (category === "success") {
    clearAttempts(sessionId);
    return allow(
      `[check-tests hook] PASSED: "${label}" ran and passed.\n` +
        `Scope note: this confirms only this test target, not the rest of the application.\n\n${tail}`
    );
  }

  writeAttempts(sessionId, attemptsSoFar + 1);
  let msg;
  if (category === "tests_not_implemented") {
    msg = `[check-tests hook] TESTS NOT IMPLEMENTED: "${label}" reported nothing to run.\n\n${tail}`;
  } else if (category === "dependency_error") {
    msg = `[check-tests hook] DEPENDENCY ERROR while running "${label}" - a required module could not be resolved.\n\n${tail}`;
  } else if (category === "code_error") {
    msg = `[check-tests hook] CODE ERROR: "${label}" could not even start running the tests ` +
      `(syntax/runtime error loading the code) - this is not a normal test failure.\n\n${tail}`;
  } else {
    msg = `[check-tests hook] TEST FAILURE: "${label}" ran but at least one test failed.\n\n${tail}`;
  }
  return block(sessionId, msg);
}

function classify(output, status) {
  const notImplPatterns = [
    /No test files found/i,
    /no tests found/i,
    /Missing script:\s*"?test"?/i,
    /0 tests? found/i,
  ];
  const depPatterns = [
    /Cannot find module/i,
    /MODULE_NOT_FOUND/i,
    /ERR_MODULE_NOT_FOUND/i,
    /npm ERR!/i,
    /ENOENT.*node_modules/i,
  ];
  const codeErrPatterns = [
    /SyntaxError/i,
    /ReferenceError/i,
    /Cannot use import statement/i,
    /Unexpected token/i,
    /Suite failed to run/i,
    /Failed to load/i,
  ];

  if (notImplPatterns.some((r) => r.test(output))) return "tests_not_implemented";
  if (depPatterns.some((r) => r.test(output))) return "dependency_error";
  if (codeErrPatterns.some((r) => r.test(output))) return "code_error";
  if (status === 0) return "success";
  return "test_failure";
}

try {
  main();
} catch (e) {
  // An internal bug in the hook must not present as a silent pass.
  console.error(`[check-tests hook] INTERNAL HOOK ERROR (treat as unresolved): ${e.stack || e}`);
  process.exit(2);
}
