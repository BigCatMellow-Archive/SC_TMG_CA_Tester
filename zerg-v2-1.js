'use strict';
const D = window.SCTMG_ZERG;
const STORAGE='sctmg_zerg_v5', PLAY='sctmg_play', ROSTERS='sctmg_zerg_rosters_v1';
const roleColors={Hero:'var(--hero)',Elite:'var(--elite)',Core:'var(--core)',Support:'var(--support)',Other:'var(--other)'};
const phaseDefs=[
  {name:'Movement',short:'Move',color:'#72a7ff'},
  {name:'Assault',short:'Assault',color:'#ff9a55'},
  {name:'Combat',short:'Combat',color:'#f06b4f'},
  {name:'Scoring',short:'Score',color:'#8edf7f'}
];
const defaultState={view:'build',refTab:'library',scaleId:'standard',factionId:'kerrigans-swarm',army:[],tactical:[],tacticalTapped:[],battleSupplyAvailable:4,play:{round:1,phase:0,vpYou:0,vpFoe:0},search:'',savedRosters:[]};
let state=structuredClone(defaultState), corruptRaw=null;
const app=document.getElementById('app'), modal=document.getElementById('modal'), modalMount=document.getElementById('modalMount'), rosterImport=document.getElementById('rosterImport');
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function parseJSON(raw,fallback){try{return raw?JSON.parse(raw):fallback}catch{return fallback}}
function load(){
  try{
    const raw=localStorage.getItem(STORAGE); if(raw){try{const s=JSON.parse(raw);Object.assign(state,s)}catch{corruptRaw=raw}}
    else {const v4=parseJSON(localStorage.getItem('sc-tmg-zerg-v4'),null);if(v4){state.army=(v4.units||[]).map((e,i)=>{const u=D.UNITS.find(x=>x.id===e.unitId);if(!u)return null;const tierIdx=Math.max(0,u.tiers.findIndex(t=>t.tier===(e.tier&&e.tier.tier)));return{key:'k'+Date.now()+i,unitId:e.unitId,tierIdx,upgs:(e.selectedUpgrades||[]).map(x=>x.name),modelsLost:0,deployed:false}}).filter(Boolean);state.tactical=v4.tactical||[];state.scaleId=v4.scaleId||state.scaleId;state.factionId=v4.factionId||state.factionId}}
    const p=parseJSON(localStorage.getItem(PLAY),null);if(p)state.play={round:p.round||1,phase:p.phase||0,vpYou:p.vpYou||0,vpFoe:p.vpFoe||0};
    const rs=parseJSON(localStorage.getItem(ROSTERS),[]);state.savedRosters=Array.isArray(rs)?rs:[];
  }catch(e){console.error(e)}
  state.army=(state.army||[]).filter(e=>D.UNITS.some(u=>u.id===e.unitId)).map(e=>({modelsLost:0,deployed:false,upgs:[],...e}));
  state.tactical=(state.tactical||[]).filter(id=>D.TACTICAL_CARDS.some(t=>t.id===id));
  state.tacticalTapped=(state.tacticalTapped||[]).filter(id=>state.tactical.includes(id));
}
function save(){if(corruptRaw)return;try{localStorage.setItem(STORAGE,JSON.stringify({army:state.army,tactical:state.tactical,tacticalTapped:state.tacticalTapped,battleSupplyAvailable:state.battleSupplyAvailable,scaleId:state.scaleId,factionId:state.factionId}))}catch{}}
function savePlay(){try{localStorage.setItem(PLAY,JSON.stringify(state.play))}catch{}}
function saveRosters(){try{localStorage.setItem(ROSTERS,JSON.stringify(state.savedRosters))}catch{}}
function scale(){return D.ENGAGEMENT_SCALES.find(s=>s.id===state.scaleId)||D.ENGAGEMENT_SCALES[1]}
function faction(){return D.FACTION_CARDS.find(f=>f.id===state.factionId)||D.FACTION_CARDS[0]}
function parseCost(v){if(typeof v==='string'&&v.includes('/'))return parseInt(v.split('/')[0],10)||0;return parseInt(v,10)||0}
function upgrades(unit){const out=[];Object.entries(unit.upgrades||{}).forEach(([phase,list])=>list.forEach(u=>out.push({...u,phase})));return out}
function entryCost(e){const u=D.UNITS.find(x=>x.id===e.unitId);if(!u)return 0;const tier=u.tiers[e.tierIdx]||{};return (tier.cost||0)+(e.upgs||[]).reduce((s,n)=>{const x=upgrades(u).find(z=>z.name===n);return s+(x?parseCost(x.cost):0)},0)}
function totals(){let minerals=0,supply=0;state.army.forEach(e=>{const u=D.UNITS.find(x=>x.id===e.unitId);if(!u)return;const t=u.tiers[e.tierIdx];minerals+=entryCost(e);supply+=t?.supply||0});const gas=state.tactical.reduce((s,id)=>s+(D.TACTICAL_CARDS.find(t=>t.id===id)?.cost||0),0);return{minerals,gas,supply}}
function slotState(){const base={...(faction().slots||{})};state.tactical.forEach(id=>{const t=D.TACTICAL_CARDS.find(x=>x.id===id);Object.entries(t?.slots||{}).forEach(([k,v])=>base[k]=(base[k]||0)+v)});const used={hero:0,elite:0,core:0,support:0};state.army.forEach(e=>{const r=D.UNITS.find(u=>u.id===e.unitId)?.role?.toLowerCase();if(r in used)used[r]++});return{base,used}}
function legality(){const t=totals(),s=scale(),slots=slotState(),issues=[];if(s.id!=='grand'&&t.minerals>s.minerals)issues.push(`${t.minerals-s.minerals} minerals over`);if(s.id!=='grand'&&t.gas>s.gas)issues.push(`${t.gas-s.gas} vespene over`);Object.keys(slots.base).forEach(k=>{if((slots.used[k]||0)>(slots.base[k]||0))issues.push(`${cap(k)} slot over`)});const counts={};state.army.forEach(e=>{const u=D.UNITS.find(x=>x.id===e.unitId);if(u?.unique)counts[u.id]=(counts[u.id]||0)+1});Object.entries(counts).forEach(([id,n])=>{if(n>1)issues.push(`${D.UNITS.find(u=>u.id===id)?.name||id} duplicated`)});return issues}
function cap(s){return s?String(s).charAt(0).toUpperCase()+String(s).slice(1):''}
function relevantUnits(){const f=faction();return D.UNITS.filter(u=>!u.factionTag||u.factionTag===f.name)}
function parseRange(str){const m=String(str||'').match(/(\d+)(?:-(\d+))?/);if(!m)return{min:0,max:0};return{min:+m[1],max:m[2]?+m[2]:+m[1]}}
function startModels(u,tierIdx){return parseRange(u.tiers[tierIdx]?.models).max}
function effectiveTier(u,purchased,remaining){if(remaining<=0)return -1;for(let i=purchased;i<u.tiers.length;i++)if(remaining>=parseRange(u.tiers[i].models).min)return i;return u.tiers.length-1}
function roleVar(role){return roleColors[role]||'var(--other)'}
function phaseColor(label){const p=phaseDefs.find(x=>label?.toLowerCase().includes(x.name.toLowerCase()));return p?.color||'var(--muted)'}
function slotsHTML(){const {base,used}=slotState();return ['hero','elite','core','support'].filter(k=>base[k]).map(k=>`<div class="slot ${(used[k]||0)>base[k]?'over':''}"><span>${cap(k)}</span><strong>${used[k]||0} / ${base[k]}</strong></div>`).join('')}
function resourceHTML(){const t=totals(),s=scale(),grand=s.id==='grand';return `<div class="resource-grid"><div class="resource ${!grand&&t.minerals>s.minerals?'over':''}"><span class="label">Minerals</span><strong>${t.minerals}</strong><span class="cap">/ ${grand?'∞':s.minerals}</span></div><div class="resource ${!grand&&t.gas>s.gas?'over':''}"><span class="label">Vespene</span><strong>${t.gas}</strong><span class="cap">/ ${grand?'∞':s.gas}</span></div><div class="resource"><span class="label">Supply</span><strong>${t.supply}</strong><span class="cap">fielded</span></div></div>`}
function topbar(){return `<header class="topbar"><a class="brand" href="Command Center.dc.html"><span class="brand-mark">Z</span><span class="brand-copy"><strong>The Swarm</strong><span>${esc(faction().name)} · ${esc(scale().name)}</span></span></a><div class="mode-switch" aria-label="Primary mode"><button data-action="view" data-view="build" aria-current="${state.view==='build'?'page':'false'}">Build</button><button data-action="view" data-view="battle" aria-current="${state.view==='battle'?'page':'false'}">Battle</button><button data-action="view" data-view="reference" aria-current="${state.view==='reference'?'page':'false'}">Reference</button></div><div class="utility"><button data-action="search">Search</button><button data-action="saved">Saved</button><button class="primary" data-action="add-unit">Add unit</button></div></header>`}
function mobileNav(){return `<nav class="mobile-nav" aria-label="Primary"><button data-action="view" data-view="build" aria-current="${state.view==='build'?'page':'false'}">Swarm</button><button data-action="view" data-view="battle" aria-current="${state.view==='battle'?'page':'false'}">Battle</button><button data-action="view" data-view="reference" aria-current="${state.view==='reference'?'page':'false'}">Reference</button></nav>`}
function alertHTML(){if(!corruptRaw)return'';return `<div class="storage-alert" role="alert"><strong>Saved swarm data could not be read.</strong><span>The raw data is preserved and automatic saving is paused.</span><button data-action="download-recovery">Download backup</button><button data-action="reset-storage">Reset saved state</button></div>`}
function hero(title,kicker,copy,actions=true){return `<section class="hero"><div><div class="eyebrow">${esc(kicker)}</div><h1>${esc(title)}</h1><div class="hero-copy">${esc(copy)}</div>${actions?`<div class="hero-actions"><button class="btn primary" data-action="add-unit">Add unit</button><button class="btn" data-action="saved">Saved rosters</button><button class="btn" data-action="print">Print army sheet</button></div>`:''}</div>${resourceHTML()}</section>`}
