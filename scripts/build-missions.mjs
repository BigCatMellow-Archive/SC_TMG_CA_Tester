// Regenerates missions-data.js from uploads/missions.html's embedded MISSIONS/MAPS script
// block, the same way build-units.mjs handles the faction files. Update missions by pasting
// a newer exported missions.html into uploads/, then rerun `npm run build`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const START_MARKER = 'const MISSIONS = [';
const END_MARKER = /\n[ \t]*const STORAGE_KEY/;

export function buildMissions() {
  const sourcePath = path.join(rootDir, 'uploads', 'missions.html');
  const outPath = path.join(rootDir, 'missions-data.js');

  const html = fs.readFileSync(sourcePath, 'utf8');

  const startIdx = html.indexOf(START_MARKER);
  if (startIdx === -1) {
    throw new Error(`uploads/missions.html: could not find "${START_MARKER}"`);
  }
  const endMatch = html.slice(startIdx).match(END_MARKER);
  if (!endMatch) {
    throw new Error('uploads/missions.html: could not find the "const STORAGE_KEY" boundary after the data block');
  }
  const endIdxAbs = startIdx + endMatch.index;
  const before = html.slice(startIdx, endIdxAbs);
  const lastCloseIdx = before.lastIndexOf('];');
  if (lastCloseIdx === -1) {
    throw new Error('uploads/missions.html: could not find the closing "];" of the MAPS array');
  }
  const dataBlock = before.slice(0, lastCloseIdx + 2);

  if (!/const MAPS = \[/.test(dataBlock)) {
    throw new Error('uploads/missions.html: expected a "const MAPS = [" declaration between MISSIONS and STORAGE_KEY');
  }

  const output = `// StarCraft TMG — Missions + deployment maps (extracted from uploads/missions.html)
window.SCTMG_MISSIONS = (function () {
${dataBlock}
  return { MISSIONS, MAPS };
})();
`;

  fs.writeFileSync(outPath, output);
  console.log('  wrote missions-data.js (from uploads/missions.html)');
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? '')) {
  console.log('Building missions data...');
  buildMissions();
}
