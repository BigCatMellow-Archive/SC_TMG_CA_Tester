// Regenerates rules-data.js from uploads/rules.html.
//
// Unlike the faction/mission files, rules.html is real prose HTML (`.section` / `.subsection`
// / `.rule-item` markup), not an embedded JS data literal — so this is an actual parser, not
// a copy-paste extractor. Section wording, meta text, intros, and rule bullets are all read
// fresh from the HTML every run. A handful of purely cosmetic choices (accent color, icon key,
// a couple of display-name tweaks, the synthetic group names used where the source has a bare
// list with no subsection heading) aren't present in the source markup at all — those live in
// SECTION_CONFIG below and only need a one-line edit if a brand-new top-level section is added.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const SECTION_CONFIG = {
  overview: { color: '#8b7cf6', icon: 'overview', bareListGroupName: 'The Four Phases' },
  concepts: { color: '#38d3e8', icon: 'concepts' },
  'round-structure': { id: 'round', color: '#f2c14e', icon: 'round' },
  'phase-movement': { color: '#4f8df9', icon: 'p1', name: 'Movement Phase' },
  'phase-assault': { color: '#f9822f', icon: 'p2', name: 'Assault Phase' },
  'phase-combat': { color: '#f04a4a', icon: 'p3', name: 'Combat Phase' },
  'phase-scoring': { color: '#35c76b', icon: 'p4' },
  situations: { color: '#ec5f99', icon: 'situations' },
  abilities: { color: '#b06ef7', icon: 'abilities' },
  mistakes: { color: '#f04a4a', icon: 'mistakes', kind: 'mistakes', bareListGroupName: 'Judge Reminders' },
};

function decodeEntities(text) {
  return String(text)
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Slices from `html[startIdx]` (which must be the start of an opening `<div`) through its
// matching `</div>`, tracking nesting depth so inner divs don't confuse the boundary.
function sliceBalancedDiv(html, startIdx) {
  const tagRe = /<div\b|<\/div>/g;
  tagRe.lastIndex = startIdx;
  let depth = 0;
  let match;
  while ((match = tagRe.exec(html))) {
    if (match[0] === '</div>') {
      depth -= 1;
      if (depth === 0) return html.slice(startIdx, tagRe.lastIndex);
    } else {
      depth += 1;
    }
  }
  throw new Error('sliceBalancedDiv: unbalanced <div> starting at ' + startIdx);
}

function findAllBalancedDivs(html, openTagPattern) {
  const blocks = [];
  const re = new RegExp(openTagPattern, 'g');
  let match;
  while ((match = re.exec(html))) {
    const block = sliceBalancedDiv(html, match.index);
    blocks.push(block);
    re.lastIndex = match.index + block.length;
  }
  return blocks;
}

function textOf(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

// Like textOf, but keeps <strong> emphasis as **markdown bold** instead of dropping it.
function markdownTextOf(html) {
  return decodeEntities(html.replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**').replace(/<[^>]+>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
}

// Converts one `<li class="rule-item">...</li>` inner HTML into `{ ph?, t, ordered? }`.
function parseRuleItem(raw) {
  let html = raw.trim();
  let ph;

  const badgeMatch = html.match(/^<span class="phase-badge (\w+)">[^<]*<\/span>\s*/);
  if (badgeMatch) {
    ph = capitalize(badgeMatch[1]);
    html = html.slice(badgeMatch[0].length);
  }

  let ordered = false;
  const orderedMatch = html.match(/^<strong>\d+\.<\/strong>\s*/);
  if (orderedMatch) {
    ordered = true;
    html = html.slice(orderedMatch[0].length);
  }

  const t = decodeEntities(html.replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**'))
    .replace(/\s+/g, ' ')
    .trim();

  const item = ph ? { ph, t } : { t };
  return { item, ordered };
}

function parseRuleList(ulHtml) {
  const items = [];
  let ordered = true;
  const liRe = /<li class="rule-item">([\s\S]*?)<\/li>/g;
  let match;
  while ((match = liRe.exec(ulHtml))) {
    const { item, ordered: itemOrdered } = parseRuleItem(match[1]);
    items.push(item);
    if (!itemOrdered) ordered = false;
  }
  if (items.length === 0) ordered = false;
  return { items, ordered };
}

function parseSubsections(sectionBodyHtml) {
  const blocks = findAllBalancedDivs(sectionBodyHtml, '<div class="subsection"[^>]*>');
  return blocks.map((block) => {
    const name = textOf(block.match(/<span class="subsection-name">([\s\S]*?)<\/span>/)[1]).replace(/^\d+(\.\d+)?\s+/, '');
    const ulMatch = block.match(/<ul class="rule-list">([\s\S]*?)<\/ul>/);
    const { items, ordered } = ulMatch ? parseRuleList(ulMatch[1]) : { items: [], ordered: false };
    const group = { name, items };
    if (ordered) group.ordered = true;
    return group;
  });
}

function parseBareList(sectionBodyHtml, groupName) {
  const ulMatch = sectionBodyHtml.match(/<ul class="rule-list"[^>]*>([\s\S]*?)<\/ul>/);
  if (!ulMatch) return null;
  const { items, ordered } = parseRuleList(ulMatch[1]);
  const group = { name: groupName, items };
  if (ordered) group.ordered = true;
  return group;
}

function parseMistakeItems(sectionBodyHtml, groupName) {
  const items = [];
  const re = /<div class="mistake-item">([\s\S]*?)<\/div>/g;
  let match;
  while ((match = re.exec(sectionBodyHtml))) {
    items.push({ t: textOf(match[1]) });
  }
  if (items.length === 0) return null;
  return { name: groupName, items };
}

function parseSection(sectionHtml, index) {
  const sourceId = sectionHtml.match(/<div class="section" id="([^"]+)"/)[1];
  const config = SECTION_CONFIG[sourceId];
  if (!config) {
    throw new Error(
      `rules.html has a section id="${sourceId}" with no entry in SECTION_CONFIG (build-rules.mjs). ` +
      'Add one (color/icon, and name/bareListGroupName if needed) and rerun.'
    );
  }

  const nameBlock = sectionHtml.match(/<div class="section-name">([\s\S]*?)<\/div>/)[1];
  const badgeMatch = nameBlock.match(/<span class="phase-badge (\w+)">[^<]*<\/span>/);
  const phase = badgeMatch ? capitalize(badgeMatch[1]) : undefined;
  const nameBlockWithoutBadge = badgeMatch ? nameBlock.replace(badgeMatch[0], '') : nameBlock;
  const rawName = textOf(nameBlockWithoutBadge).replace(/^\d+\.\s*/, '');
  const name = config.name || rawName;

  const meta = textOf(sectionHtml.match(/<div class="section-meta">([\s\S]*?)<\/div>/)[1]);

  const bodyMatch = sectionHtml.match(/<div class="section-body">/);
  const sectionBodyHtml = sliceBalancedDiv(sectionHtml, bodyMatch.index);

  const proseMatches = [...sectionBodyHtml.matchAll(/<p class="prose( practical)?">([\s\S]*?)<\/p>/g)];
  const intro = proseMatches.find((m) => !m[1]);
  const practical = proseMatches.find((m) => m[1]);

  let groups = parseSubsections(sectionBodyHtml);
  if (groups.length === 0) {
    const groupName = config.bareListGroupName || name;
    const group = parseMistakeItems(sectionBodyHtml, groupName) || parseBareList(sectionBodyHtml, groupName);
    if (group) groups = [group];
  }

  const section = {
    id: config.id || sourceId,
    num: String(index + 1).padStart(2, '0'),
    name,
    meta,
    color: config.color,
    icon: config.icon,
  };
  if (phase) section.phase = phase;
  if (config.kind) section.kind = config.kind;
  if (intro) section.intro = markdownTextOf(intro[2]);
  if (practical) section.practical = markdownTextOf(practical[2]);
  section.groups = groups;

  return section;
}

// ---- serialization (single-quoted JS object literals, matching the codebase's own style) ----

function quoteJs(str) {
  if (str.includes("'") && !str.includes('"')) {
    return `"${str.replace(/\\/g, '\\\\').replace(/\n/g, '\\n')}"`;
  }
  return `'${str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
}

function serializeItem(item) {
  const parts = [];
  if (item.ph) parts.push(`ph: ${quoteJs(item.ph)}`);
  parts.push(`t: ${quoteJs(item.t)}`);
  return `{ ${parts.join(', ')} }`;
}

function serializeGroup(group, indent) {
  const inner = indent + '  ';
  const header = `{ name: ${quoteJs(group.name)}${group.ordered ? ', ordered: true' : ''}, items: [`;
  const items = group.items.map((item) => inner + '  ' + serializeItem(item)).join(',\n');
  return `${header}\n${items}\n${inner}]}`;
}

function serializeSection(section) {
  const lines = [];
  const indent = '      ';
  const header = [
    `id: ${quoteJs(section.id)}`,
    `num: ${quoteJs(section.num)}`,
    `name: ${quoteJs(section.name)}`,
    `meta: ${quoteJs(section.meta)}`,
    `color: ${quoteJs(section.color)}`,
    `icon: ${quoteJs(section.icon)}`,
  ];
  if (section.phase) header.push(`phase: ${quoteJs(section.phase)}`);
  if (section.kind) header.push(`kind: ${quoteJs(section.kind)}`);
  lines.push(indent + header.join(', '));
  if (section.intro) lines.push(indent + `intro: ${quoteJs(section.intro)}`);
  if (section.practical) lines.push(indent + `practical: ${quoteJs(section.practical)}`);
  const groups = section.groups.map((g) => indent + '  ' + serializeGroup(g, indent + '  ')).join(',\n');
  lines.push(indent + 'groups: [\n' + groups + `\n${indent}]`);
  return `    {\n${lines.join(',\n')}\n    }`;
}

export function buildRules() {
  const sourcePath = path.join(rootDir, 'uploads', 'rules.html');
  const outPath = path.join(rootDir, 'rules-data.js');

  const html = fs.readFileSync(sourcePath, 'utf8');
  const sectionHtmls = findAllBalancedDivs(html, '<div class="section" id="[^"]+"');
  if (sectionHtmls.length === 0) {
    throw new Error('uploads/rules.html: found no <div class="section" id="..."> blocks');
  }

  const sections = sectionHtmls.map((sectionHtml, i) => parseSection(sectionHtml, i));

  const output = `// StarCraft TMG — Rules reference data (restructured from uploads/rules.html)
window.SCTMG_RULES = {
  sections: [
${sections.map(serializeSection).join(',\n')}
  ]
};
`;

  fs.writeFileSync(outPath, output);
  console.log('  wrote rules-data.js (from uploads/rules.html)');
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? '')) {
  console.log('Building rules data...');
  buildRules();
}
