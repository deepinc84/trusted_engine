#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const roots = ["app", "components", "lib"];
const markerRegex = /^(<<<<<<<|=======|>>>>>>>)/m;
const matches = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    const content = fs.readFileSync(fullPath, "utf8");
    if (!markerRegex.test(content)) continue;

    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      if (/^(<<<<<<<|=======|>>>>>>>)/.test(lines[i])) {
        matches.push(`${fullPath}:${i + 1}:${lines[i]}`);
      }
    }
  }
}

try {
  for (const root of roots) {
    if (fs.existsSync(root)) walk(root);
  }

  if (matches.length > 0) {
    console.error("Merge conflict markers found:\n");
    console.error(matches.join("\n"));
    process.exit(1);
  }
} catch (error) {
  console.error("Unable to run merge conflict marker check.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
