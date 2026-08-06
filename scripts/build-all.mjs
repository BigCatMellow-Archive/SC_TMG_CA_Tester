// Regenerates every *-data.js file in this project from its uploads/*.html source.
// Run this after editing/replacing anything in uploads/ (newer rules text, unit/mission
// updates, etc.) — the UI (.dc.html files) is untouched, it just reads the freshly written
// data.js files on next load.
import { buildFaction } from './build-units.mjs';
import { buildMissions } from './build-missions.mjs';
import { buildRules } from './build-rules.mjs';

const FACTIONS = [
  { key: 'terran', label: 'Terran', global: 'SCTMG_TERRAN' },
  { key: 'zerg', label: 'Zerg', global: 'SCTMG_ZERG' },
  { key: 'protoss', label: 'Protoss', global: 'SCTMG_PROTOSS' },
];

console.log('Building all StarCraft RPG Companion data files...\n');

console.log('Faction data:');
for (const faction of FACTIONS) buildFaction(faction);

console.log('\nMissions data:');
buildMissions();

console.log('\nRules data:');
buildRules();

console.log('\nDone.');
