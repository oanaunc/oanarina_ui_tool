import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

// npm run mcp:test intentionally bundles the standalone download first. Keep
// source-only checks usable while app/download builds are explicitly paused.
const root = fileURLToPath(new URL('../', import.meta.url));
const testDir = path.join(root, 'mcp/tests');
const tests = fs.readdirSync(testDir)
  .filter(name => name.endsWith('.test.ts') && name !== 'bundled.test.ts')
  .sort()
  .map(name => path.join(testDir, name));
if (!tests.length) throw Error('No MCP source tests found.');
console.log('MCP source checks: standalone bundled-server acceptance is deferred; no archive is generated.');
const result = spawnSync(process.execPath, [
  path.join(root, 'mcp/node_modules/tsx/dist/cli.mjs'),
  '--tsconfig', path.join(root, 'mcp/tsconfig.json'), '--test', ...tests,
], {cwd: root, stdio: 'inherit'});
if (result.error) throw result.error;
if (result.signal) console.error(`MCP source checks stopped by ${result.signal}.`);
process.exitCode = result.status ?? 1;
