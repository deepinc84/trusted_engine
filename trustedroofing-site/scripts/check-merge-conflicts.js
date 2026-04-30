#!/usr/bin/env node
const { execSync } = require('node:child_process');

try {
  const output = execSync('rg -n "^(<<<<<<<|=======|>>>>>>>)" app components lib', { encoding: 'utf8' }).trim();
  if (output) {
    console.error('Merge conflict markers found:\n');
    console.error(output);
    process.exit(1);
  }
} catch (error) {
  if (typeof error.status === 'number' && error.status === 1) {
    process.exit(0);
  }

  console.error('Unable to run merge conflict marker check.');
  console.error(error.message || error);
  process.exit(1);
}
