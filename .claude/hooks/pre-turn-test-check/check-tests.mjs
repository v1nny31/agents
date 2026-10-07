#!/usr/bin/env node
/**
 * Generic Claude Code Stop-hook verification gate.
 *
 * Behavior:
 *   - Runs once whenever Claude's main turn reaches Stop.
 *   - Uses .claude/hooks/verification-target.json when present.
 *   - Otherwise safely auto-detects a small set of conventional test commands.
 *   - If no verification target exists yet, ALLOWS the stop with a visible notice.
 *   - If verification fails, BLOCKS the stop and feeds the failure back to Claude.
 *   - After one fix/retry cycle, a second failure ALLOWS the stop and reports the
 *     unresolved failure instead of trapping Claude in a loop.
 *
 * Important:
 *   - This hook never installs dependencies automatically.
 *   - Project-specific setup (Docker, DB, migrations, env preparation, etc.)
 *     belongs in verification-target.json.
 *   - State is stored in the OS temp directory, not in the repository.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CONFIG_PATH = path.join(
  PROJECT_DIR,
  ".claude",
  "hooks",
  "verification-target.json"
);

const STATE_ROOT = path.join(os.tmpdir(), "claude-stop-verification");
const MAX_OUTPUT = 3000;

function readInput() {
  try {
    const raw = fs.readFileSync(0, "utf8");
    return raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    return {
      enabled: true,
      autoDetect: true,
      requireVerification: false,
      maxAttempts: 2,
      timeoutMs: 120000,
      setupCommand: null,
      setupOnce: true,
      checks: [],
    };
  }

  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

    return {
      enabled: config.enabled !== false,
      autoDetect: config.autoDetect !== false,
      requireVerification: config.requireVerification === true,
      maxAttempts: positiveInt(config.maxAttempts, 2),
      timeoutMs: positiveInt(config.timeoutMs, 120000),
      setupCommand: stringOrNull(config.setupCommand),
      setupOnce: config.setupOnce !== false,
      checks: Array.isArray(config.checks) ? config.checks : [],
    };
  } catch (error) {
    return {
      __configError: `Could not parse ${CONFIG_PATH}: ${error.message}`,
    };
  }
}

function positiveInt(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function stringOrNull(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function projectRelativePath(value) {
  if (!value) return PROJECT_DIR;
  return path.resolve(PROJECT_DIR, value);
}

function stateFile(sessionId) {
  return path.join(
    STATE_ROOT,
    `${sanitize(sessionId)}.json`
  );
}

function sanitize(value) {
  return String(value || "default").replace(/[^a-zA-Z0-9._-]/g, "_");
}

function loadState(sessionId) {
  try {
    return JSON.parse(fs.readFileSync(stateFile(sessionId), "utf8"));
  } catch {
    return {
      attempts: 0,
      setupDone: false,
      lastFailure: null,
    };
  }
}

function saveState(sessionId, state) {
  fs.mkdirSync(STATE_ROOT, { recursive: true });
  fs.writeFileSync(stateFile(sessionId), JSON.stringify(state, null, 2));
}

function clearState(sessionId) {
  try {
    fs.unlinkSync(stateFile(sessionId));
  } catch {
    // Nothing to clear.
  }
}

function runCommand(command, cwd, timeoutMs) {
  return spawnSync(command, {
    cwd,
    encoding: "utf8",
    shell: true,
    timeout: timeoutMs,
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
  });
}

function trimOutput(output) {
  const text = String(output || "").trim();
  if (!text) return "(no output)";
  return text.length > MAX_OUTPUT
    ? `… [output truncated]\n${text.slice(-MAX_OUTPUT)}`
    : text;
}

function resultOutput(result) {
  return trimOutput(
    `${result.stdout || ""}\n${result.stderr || ""}`
  );
}

function commandSucceeded(result) {
  return result.status === 0 && !result.error;
}

function formatCommandFailure(label, result) {
  if (result.error) {
    return `${label} could not start: ${result.error.message}`;
  }

  if (result.signal === "SIGTERM") {
    return `${label} timed out after the configured timeout`;
  }

  return `${label} exited with status ${result.status}`;
}

function detectPackageManager(pkg) {
  const packageManager = typeof pkg.packageManager === "string"
    ? pkg.packageManager.split("@")[0]
    : null;

  if (["npm", "pnpm", "yarn", "bun"].includes(packageManager)) {
    return packageManager;
  }

  if (fs.existsSync(path.join(PROJECT_DIR, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(PROJECT_DIR, "yarn.lock"))) return "yarn";
  if (
    fs.existsSync(path.join(PROJECT_DIR, "bun.lockb")) ||
    fs.existsSync(path.join(PROJECT_DIR, "bun.lock"))
  ) return "bun";

  return "npm";
}

function hasRealNpmTestScript(pkg) {
  const script = pkg?.scripts?.test;
  if (typeof script !== "string" || !script.trim()) return false;
  return !/missing script|no test specified/i.test(script);
}

function autoDetectChecks() {
  const checks = [];

  const packageJson = path.join(PROJECT_DIR, "package.json");
  if (fs.existsSync(packageJson)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJson, "utf8"));

      if (hasRealNpmTestScript(pkg)) {
        const manager = detectPackageManager(pkg);
        checks.push({
          name: "tests",
          command:
            manager === "pnpm" ? "pnpm test" :
            manager === "yarn" ? "yarn test" :
            manager === "bun" ? "bun test" :
            "npm test",
          workingDirectory: ".",
        });

        return checks;
      }
    } catch {
      // A malformed package.json is not silently converted to success.
      checks.push({
        name: "package.json",
        command: "node -e \"JSON.parse(require('fs').readFileSync('package.json','utf8'))\"",
        workingDirectory: ".",
      });

      return checks;
    }
  }

  if (fs.existsSync(path.join(PROJECT_DIR, "Cargo.toml"))) {
    return [{ name: "cargo test", command: "cargo test", workingDirectory: "." }];
  }

  if (fs.existsSync(path.join(PROJECT_DIR, "go.mod"))) {
    return [{ name: "go test", command: "go test ./...", workingDirectory: "." }];
  }

  if (
    fs.existsSync(path.join(PROJECT_DIR, "pom.xml"))
  ) {
    return [{ name: "maven test", command: "mvn test", workingDirectory: "." }];
  }

  if (
    fs.existsSync(path.join(PROJECT_DIR, "gradlew")) ||
    fs.existsSync(path.join(PROJECT_DIR, "gradlew.bat")) ||
    fs.existsSync(path.join(PROJECT_DIR, "build.gradle")) ||
    fs.existsSync(path.join(PROJECT_DIR, "build.gradle.kts"))
  ) {
    const command = process.platform === "win32"
      ? "gradlew.bat test"
      : "./gradlew test";

    return [{ name: "gradle test", command, workingDirectory: "." }];
  }

  if (
    fs.existsSync(path.join(PROJECT_DIR, "phpunit.xml")) ||
    fs.existsSync(path.join(PROJECT_DIR, "phpunit.xml.dist"))
  ) {
    const command = process.platform === "win32"
      ? "vendor/bin/phpunit"
      : "vendor/bin/phpunit";

    return [{ name: "phpunit", command, workingDirectory: "." }];
  }

  const projectFiles = fs.readdirSync(PROJECT_DIR);
  const dotnetProject = projectFiles.find(
    (file) => file.endsWith(".sln") || file.endsWith(".csproj")
  );

  if (dotnetProject) {
    return [{ name: "dotnet test", command: `dotnet test "${dotnetProject}"`, workingDirectory: "." }];
  }

  const pyproject = path.join(PROJECT_DIR, "pyproject.toml");
  const pytestMarkers = [
    "pytest",
    "[tool.pytest",
    "pytest.ini",
  ];

  if (fs.existsSync(pyproject)) {
    const text = fs.readFileSync(pyproject, "utf8");
    const hasPytest = pytestMarkers.some((marker) => text.includes(marker));

    if (hasPytest) {
      return [{ name: "pytest", command: "python -m pytest", workingDirectory: "." }];
    }
  }

  return [];
}

function configuredChecks(config) {
  return config.checks
    .filter((check) => check && typeof check.command === "string" && check.command.trim())
    .map((check) => ({
      name: stringOrNull(check.name) || check.command,
      command: check.command.trim(),
      workingDirectory: projectRelativePath(check.workingDirectory || "."),
      timeoutMs: positiveInt(check.timeoutMs, config.timeoutMs),
    }));
}

function buildChecks(config) {
  const explicit = configuredChecks(config);
  if (explicit.length > 0) return explicit;
  return config.autoDetect
    ? autoDetectChecks().map((check) => ({
        ...check,
        workingDirectory: projectRelativePath(check.workingDirectory || "."),
        timeoutMs: config.timeoutMs,
      }))
    : [];
}

function systemMessage(message) {
  console.log(JSON.stringify({ systemMessage: message }));
  process.exit(0);
}

function allow(message) {
  systemMessage(message);
}

function block(message, userMessage) {
  console.log(JSON.stringify({
    decision: "block",
    reason: message,
    systemMessage: userMessage || message,
  }));
  process.exit(0);
}

function main() {
  const input = readInput();
  const sessionId = input.session_id || "default";
  const config = loadConfig();

  if (config.__configError) {
    return allow(
      `⚠️ Stop verification unavailable: ${config.__configError}\n` +
      `The response is being allowed instead of falsely claiming that verification passed.`
    );
  }

  if (!config.enabled) {
    return allow("ℹ️ Stop verification disabled for this project.");
  }

  const state = loadState(sessionId);
  const maxAttempts = Math.max(2, config.maxAttempts);

  // If another Stop hook caused this continuation, we still perform our own
  // verification unless this hook has already exhausted its own retry budget.
  if (state.attempts >= maxAttempts) {
    return allow(
      `⚠️ Stop verification already used its ${maxAttempts}-attempt budget. ` +
      `The agent is stopping. Last verification failure:\n${state.lastFailure || "(none recorded)"}`
    );
  }

  const checks = buildChecks(config);

  if (checks.length === 0) {
    if (config.requireVerification) {
      state.attempts += 1;
      state.lastFailure =
        "No verification command is configured or confidently detectable.";

      if (state.attempts >= maxAttempts) {
        saveState(sessionId, state);
        return allow(
          `❌ VERIFICATION FAILED: no verification command is configured or confidently detectable ` +
          `after ${state.attempts} attempt(s). The agent is stopping as configured.`
        );
      }

      saveState(sessionId, state);

      return block(
        `No verification command is configured or confidently detectable.`,
        `⚠️ Verification required, but no verification command was found. ` +
        `Configure .claude/hooks/verification-target.json, then continue working. ` +
        `This is retry ${state.attempts}/${maxAttempts}.`
      );
    }

    clearState(sessionId);

    return allow(
      `ℹ️ Stop verification: no test/verification command is configured or confidently detectable. ` +
      `The response was allowed.`
    );
  }

  // Optional project-specific setup. Never install dependencies implicitly.
  if (config.setupCommand && (!config.setupOnce || !state.setupDone)) {
    const setupCwd = PROJECT_DIR;
    const setup = runCommand(config.setupCommand, setupCwd, config.timeoutMs);

    if (!commandSucceeded(setup)) {
      const failure =
        `SETUP FAILURE: ${formatCommandFailure(`"${config.setupCommand}"`, setup)}\n\n` +
        resultOutput(setup);

      state.attempts += 1;
      state.lastFailure = failure;

      if (state.attempts >= maxAttempts) {
        saveState(sessionId, state);
        return allow(
          `❌ VERIFICATION FAILED after ${state.attempts} attempt(s). ` +
          `The required setup still fails, so the agent is stopping.\n\n${failure}`
        );
      }

      saveState(sessionId, state);

      return block(
        failure,
        `⚠️ Verification setup failed. Fix the environment/setup problem, then retry. ` +
        `Attempt ${state.attempts}/${maxAttempts}.\n\n${failure}`
      );
    }

    state.setupDone = true;
    saveState(sessionId, state);
  }

  const failures = [];

  for (const check of checks) {
    const result = runCommand(
      check.command,
      check.workingDirectory,
      check.timeoutMs || config.timeoutMs
    );

    if (!commandSucceeded(result)) {
      failures.push(
        `### ${check.name}\n` +
        `Command: ${check.command}\n` +
        `Working directory: ${check.workingDirectory}\n` +
        `${formatCommandFailure("Verification command", result)}\n\n` +
        resultOutput(result)
      );
    }
  }

  if (failures.length === 0) {
    clearState(sessionId);

    return allow(
      `✅ Stop verification passed: ${checks.map((check) => check.name).join(", ")}.\n` +
      `Only these configured/detected checks were verified; this does not prove the entire application is correct.`
    );
  }

  const failureText =
    `VERIFICATION FAILURE (${failures.length} check(s))\n\n${failures.join("\n\n")}`;

  state.attempts += 1;
  state.lastFailure = failureText;

  if (state.attempts >= maxAttempts) {
    saveState(sessionId, state);

    return allow(
      `❌ VERIFICATION STILL FAILING after ${state.attempts} attempt(s). ` +
      `The retry budget is exhausted, so the agent is stopping.\n\n${failureText}`
    );
  }

  saveState(sessionId, state);

  return block(
    failureText,
    `⚠️ Verification failed. Fix the reported issue and continue the task. ` +
    `This is retry ${state.attempts}/${maxAttempts}.\n\n${failureText}`
  );
}

try {
  main();
} catch (error) {
  // A broken hook must never masquerade as a successful verification.
  // We allow the turn to end so the hook itself does not become a project
  // blocker, but make the problem explicit to the user.
  allow(
    `⚠️ Stop verification hook error: ${error.stack || error}\n` +
    `Verification could not be established. The response was allowed.`
  );
}
