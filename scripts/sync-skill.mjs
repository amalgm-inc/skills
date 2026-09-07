import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourcesPath = join(root, 'sources.json');
const sources = JSON.parse(readFileSync(sourcesPath, 'utf8'));
const [name, checkout, revision = 'HEAD'] = process.argv.slice(2);
const source = sources[name];
if (!source || !checkout || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
  throw new Error('Usage: node scripts/sync-skill.mjs <listed-skill> <source-checkout> [commit-or-ref]');
}
if (source.path !== `skills/${name}`) throw new Error('Source path must match the listed skill');

const git = (...args) => execFileSync('git', ['-C', resolve(checkout), ...args]);
const remote = git('remote', 'get-url', 'origin').toString().trim()
  .replace(/^git@github\.com:/, 'https://github.com/').replace(/\.git$/, '');
if (remote !== source.repository.replace(/\.git$/, '')) throw new Error('Checkout does not match the canonical source repository');
const commit = git('rev-parse', '--verify', '--end-of-options', `${revision}^{commit}`).toString().trim();
const entries = git('ls-tree', '-rz', commit, '--', source.path).toString().split('\0').filter(Boolean);
const files = entries.map((entry) => {
  const match = /^(100644|100755) blob ([0-9a-f]+)\t(.+)$/.exec(entry);
  if (!match) throw new Error('Skill sources must contain regular files only');
  const relative = match[3].slice(source.path.length + 1);
  if (!relative || relative.split('/').some((part) => !part || part === '..' || part.startsWith('.'))) {
    throw new Error(`Unexpected skill path: ${match[3]}`);
  }
  return { relative, content: git('cat-file', 'blob', match[2]), mode: parseInt(match[1], 8) & 0o777 };
});
const instructions = files.find((file) => file.relative === 'SKILL.md')?.content.toString();
if (!instructions?.startsWith(`---\nname: ${name}\n`)) throw new Error('Skill metadata must match its directory');

mkdirSync(join(root, 'skills'), { recursive: true });
const stage = mkdtempSync(join(root, 'skills', '.sync-'));
try {
  const stagedSkill = join(stage, name);
  for (const file of files) {
    const destination = join(stagedSkill, file.relative);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, file.content, { mode: file.mode });
  }
  const destination = join(root, 'skills', name);
  mkdirSync(dirname(destination), { recursive: true });
  rmSync(destination, { recursive: true, force: true });
  renameSync(stagedSkill, destination);
  source.commit = commit;
  writeFileSync(sourcesPath, JSON.stringify(sources, null, 2) + '\n');
  process.stdout.write(`Synced ${name} from ${source.repository} at ${commit}\n`);
} finally {
  rmSync(stage, { recursive: true, force: true });
}
