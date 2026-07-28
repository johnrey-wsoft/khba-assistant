#!/usr/bin/env node

/**
 * Reset/initialize the project after cloning the template.
 * Similar to Expo's `npx create-expo-app` reset script.
 *
 * Usage: pnpm reset-project
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const readline = require("readline");

const ROOT = path.resolve(__dirname, "..");

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function normalize(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function run(cmd, opts = {}) {
  execSync(cmd, { cwd: ROOT, stdio: "ignore", ...opts });
}

async function main() {
  console.log("\n🔧 Reset Project\n");

  // 1. Get project name
  const raw = await prompt("Enter project name: ");
  if (!raw) {
    console.error("Error: Project name cannot be empty.");
    process.exit(1);
  }

  const projectName = normalize(raw);
  if (!projectName) {
    console.error("Error: Invalid project name after normalization.");
    process.exit(1);
  }

  console.log(`\nUsing project name: ${projectName}\n`);

  // 2. Update package.json
  const pkgPath = path.join(ROOT, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.name = projectName;
  pkg.version = "0.1.0";
  delete pkg.scripts["reset-project"];
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log("✔ Updated package.json");

  // 3. Rename directory if needed
  const currentDir = path.basename(ROOT);
  if (currentDir !== projectName) {
    const newPath = path.join(path.dirname(ROOT), projectName);
    fs.renameSync(ROOT, newPath);
    console.log(`✔ Renamed directory to: ${projectName}`);
    // Update ROOT reference for remaining operations
    process.chdir(newPath);
  }

  // 4. Reinitialize git
  const gitDir = path.join(process.cwd(), ".git");
  if (fs.existsSync(gitDir)) {
    fs.rmSync(gitDir, { recursive: true, force: true });
  }
  run("git init", { cwd: process.cwd() });
  run("git add .", { cwd: process.cwd() });
  run('git commit -m "initial commit"', { cwd: process.cwd() });
  console.log("✔ Initialized git repository");

  // 5. Clean up — remove this script and the old reset.bash if present
  // Use cwd-based path since __filename still points to the pre-rename location
  const selfPath = path.join(process.cwd(), "scripts", "reset-project.js");
  if (fs.existsSync(selfPath)) {
    fs.unlinkSync(selfPath);
  }
  const oldBash = path.join(process.cwd(), "reset.bash");
  if (fs.existsSync(oldBash)) {
    fs.unlinkSync(oldBash);
  }

  // Remove the scripts directory if empty
  const scriptsDir = path.join(process.cwd(), "scripts");
  if (fs.existsSync(scriptsDir) && fs.readdirSync(scriptsDir).length === 0) {
    fs.rmdirSync(scriptsDir);
  }

  console.log("✔ Cleaned up reset files");
  console.log(`\n✅ Project "${projectName}" is ready. Happy coding!\n`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
