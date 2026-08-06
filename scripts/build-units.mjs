// Regenerates {terran,zerg,protoss}-data.js from the matching uploads/*.html army-builder export.
//
// Each uploads/<faction>.html embeds its own KEYWORDS/TAGS/UNITS/etc. data as a plain
// `<script>` block (the same block the standalone army-builder page runs on). This script
// lifts that data block out verbatim and wraps it as `window.SCTMG_<FACTION>`, so updating a
// faction is just: paste the newer exported HTML into uploads/, then rerun `npm run build`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const FACTIONS = [
  { key: 'terran', label: 'Terran', global: 'SCTMG_TERRAN' },
  { key: 'zerg', label: 'Zerg', global: 'SCTMG_ZERG' },
  { key: 'protoss', label: 'Protoss', global: 'SCTMG_PROTOSS' },
];

const START_MARKER = 'const KEYWORDS = {';
const STATE_MARKER = /\n[ \t]*let state = \{/;

function extractDataBlock(html, sourceFile) {
  const startIdx = html.indexOf(START_MARKER);
  if (startIdx === -1) {
    throw new Error(`${sourceFile}: could not find "${START_MARKER}"`);
  }
  const stateMatch = html.slice(startIdx).match(STATE_MARKER);
  if (!stateMatch) {
    throw new Error(`${sourceFile}: could not find the "let state = {" boundary after the data block`);
  }
  const stateIdxAbs = startIdx + stateMatch.index;
  const before = html.slice(startIdx, stateIdxAbs);
  const lastCloseIdx = before.lastIndexOf('];');
  if (lastCloseIdx === -1) {
    throw new Error(`${sourceFile}: could not find the closing "];" of the data block`);
  }
  return before.slice(0, lastCloseIdx + 2);
}

function requiredConstName(dataBlock, constSuffix, sourceFile) {
  const match = dataBlock.match(new RegExp(`const (\\w+)${constSuffix} = `));
  if (!match) {
    throw new Error(`${sourceFile}: could not find a "const *${constSuffix} = " declaration`);
  }
  return match[1] + constSuffix;
}

export function buildFaction({ key, label, global }) {
  const sourcePath = path.join(rootDir, 'uploads', `${key}.html`);
  const outPath = path.join(rootDir, `${key}-data.js`);

  const html = fs.readFileSync(sourcePath, 'utf8');
  const dataBlock = extractDataBlock(html, `uploads/${key}.html`);

  const factionCardsConst = requiredConstName(dataBlock, '_FACTION_CARDS', `uploads/${key}.html`);
  const unitsConst = requiredConstName(dataBlock, '_UNITS', `uploads/${key}.html`);
  const tacticalCardsConst = requiredConstName(dataBlock, '_TACTICAL_CARDS', `uploads/${key}.html`);

  const output = `// StarCraft TMG — ${label} faction data (extracted from uploads/${key}.html)
window.${global} = (function () {
${dataBlock}
  return { KEYWORDS, TAGS, SURGE_TAGS, TYPE_TAGS, ENGAGEMENT_SCALES,
    FACTION_CARDS: ${factionCardsConst}, UNITS: ${unitsConst}, TACTICAL_CARDS: ${tacticalCardsConst} };
})();
`;

  fs.writeFileSync(outPath, output);
  console.log(`  wrote ${key}-data.js (from uploads/${key}.html)`);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? '')) {
  console.log('Building faction data...');
  for (const faction of FACTIONS) buildFaction(faction);
}
