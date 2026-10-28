#!/usr/bin/env node

/**
 * Cross-platform script dispatcher based on OS architecture.
 * Automatically detects whether the host system is Windows or Linux/macOS
 * and executes the corresponding native shell script (.bat or .sh).
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const action = process.argv[2] || "setup";
const isWindows = process.platform === "win32";
const arch = process.arch;

console.log(`\n========================================================`);
console.log(` CRM Task Management - OS Script Runner`);
console.log(` Detected OS: ${process.platform} (${isWindows ? "Windows" : "Linux/macOS/Unix"}) | Arch: ${arch}`);
console.log(` Requested Action: ${action}`);
console.log(`========================================================\n`);

const scriptsDir = path.resolve(__dirname);
let command = "";
let args = [];

if (isWindows) {
  const batScript = path.join(scriptsDir, `${action}.bat`);
  if (!fs.existsSync(batScript)) {
    console.error(`Error: Windows script not found: ${batScript}`);
    process.exit(1);
  }
  command = "cmd.exe";
  args = ["/c", batScript];
} else {
  const shScript = path.join(scriptsDir, `${action}.sh`);
  if (!fs.existsSync(shScript)) {
    console.error(`Error: Shell script not found: ${shScript}`);
    process.exit(1);
  }
  // Ensure script is executable on Unix
  try {
    fs.chmodSync(shScript, "755");
  } catch (_e) {
    // ignore if permission check fails
  }
  command = "bash";
  args = [shScript];
}

const child = spawn(command, args, {
  stdio: "inherit",
  cwd: path.resolve(__dirname, ".."),
  shell: false,
});

child.on("error", (err) => {
  console.error(`Failed to start child process:`, err);
  process.exit(1);
});

child.on("close", (code) => {
  process.exit(code || 0);
});
