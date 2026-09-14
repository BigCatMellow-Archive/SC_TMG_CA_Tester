# Zerg V2 — Clean-Sheet Concept Selection

- Protocol: AIDB `CLEAN-SHEET-REDESIGN.md`
- Target: `Zerg Army.dc.html`
- Selected direction: **Living Swarm / Hive Mind**
- Status: frozen for tester implementation

## Preservation contract

### MUST PRESERVE

- Zerg army-building outcome and game rules/data;
- engagement scales, brood selection, roster/tactical state;
- unit tiers, upgrades, slot/resource legality information;
- battle round/phase/VP/deployment/casualty tracking;
- searchable reference material;
- save/load/import/export/print capability;
- `sctmg_zerg_v5`, `sctmg_play`, and saved-roster compatibility;
- existing V4 migration path;
- touch/keyboard/accessibility basics appropriate to the web surface.

### MUST NOT ASSUME

- incumbent six-tab navigation;
- incumbent 480px-centered phone-column composition on desktop;
- sticky HUD/resource-strip layout;
- incumbent card hierarchy;
- Rajdhani/Chakra Petch typography;
- clipped-corner sci-fi treatment as the primary identity device;
- bottom navigation containing every content category;
- Library/Tactics/Brood/Codex as peer-level product jobs.

## Independent concepts

### A — Living Swarm / Hive Mind

Treat the army as a living system. Primary jobs become **Build / Battle / Reference**. Build emphasizes legality and capacity; Battle becomes a purpose-built table surface; Reference absorbs library, tactics, brood, and codex. Visual identity comes from chitin purple, acid green, bone contrast, asymmetric organic geometry, and role spines rather than HUD chrome.

Strengths:
- fastest route to actual player jobs;
- strong Zerg specificity without sacrificing scanning speed;
- scales naturally from desktop workspace to mobile thumb navigation;
- preserves dense rules without making them primary navigation.

Risk:
- could drift toward a generic dark dashboard if organic/signature choices are weakened.

### B — Brood Ledger

A highly disciplined tactical manifest: compact roster ledger, legality/status rows, and strong data scanning.

Strengths:
- extremely fast to read and compare;
- excellent for dense army-building information;
- implementation straightforward.

Risk:
- too faction-neutral; without branding it could belong to almost any tabletop army builder.

### C — Nydus Network

A spatial node/network metaphor. Units, brood adaptations, and battle state behave like connected biological nodes.

Strengths:
- highest divergence and strongest Zerg metaphor;
- memorable and product-specific.

Risk:
- spatial navigation imposes unnecessary cost on repeated roster operations and dense comparison.

## Council decision

**Living Swarm wins.**

It is not the most divergent concept—Nydus Network is—but it best balances:

- primary-job speed;
- Zerg specificity;
- dense roster readability;
- battle-table usefulness;
- responsive quality;
- implementation realism.

The selected direction intentionally borrows Nydus's organic character without adopting its slower spatial navigation model.

## Incumbent resemblance gate

Implemented Living Swarm vs incumbent:

| Dimension | Score | Reason |
| --- | ---: | --- |
| Information architecture | 2 | Six peers become three jobs; reference categories are subordinate. |
| Navigation model | 2 | Build/Battle/Reference replaces Roster/Battle/Library/Tactics/Brood/Codex. |
| Spatial composition | 2 | Desktop becomes a wide working surface with contextual side columns. |
| Interaction placement/model | 2 | Build legality, battle controls, and reference search are job-specific surfaces. |
| Component/surface grammar | 2 | Role spines, bone status fields, organic marks, and simpler surfaces replace HUD-card repetition. |
| Typography | 2 | Inter role system replaces Rajdhani/Chakra Petch sci-fi display dependence. |
| Color role system | 1 | Purple lineage is intentionally retained for Zerg, but acid/bone/semantic roles are substantially changed. |
| Mobile representation | 2 | Three thumb-size jobs + mobile search replace six equal bottom tabs and duplicated utilities. |

**Total: 15 / 16. Materially re-conceived: 7 / 8. MODE C gate: PASS.**

Stripped of logo/name, the interface is not basically the incumbent: the job model, navigation, desktop composition, battle surface, reference architecture, typography, and mobile representation all change materially.

## Frozen implementation contract

### Product job

Help a player build a coherent Zerg army, operate it during a match, and retrieve rules quickly without mixing those jobs together.

### Desktop composition

- persistent compact top identity/utility bar;
- central Build/Battle/Reference mode switch;
- wide main workspace;
- Build: roster/status left, brood/adaptations right;
- Battle: live controls + field organisms left, supply/tactics right;
- Reference: section rail + searchable content field.

### Mobile composition

- compact identity bar with global Search;
- no duplicate top mode switch;
- one persistent 3-item bottom navigation;
- Build/Battle/Reference recompose to single-column flows;
- approximately 62px-high primary navigation targets at 390px.

### Type

Inter. Meaningful metadata remains readable; hierarchy comes from size, weight, spacing, color, and placement rather than microscopic labels.

### Color roles

- near-black: environment;
- chitin purple: faction structure/identity;
- acid green: active/primary action/current selection;
- bone: high-contrast status/legality field;
- red/orange: damage/conflict;
- role-specific accents: Hero/Elite/Core/Support scanning.

### Signature choices

- army described as a living system rather than a conventional dashboard;
- roster legality/status presented as a biological readiness field;
- vertical role spines on organisms;
- reference content intentionally demoted beneath the three real jobs;
- organic asymmetric marks used sparingly rather than repeated decorative clipping.

## Pre-promotion render evidence

Representative split-build Chromium fixture:

```text
desktop errors: 0
desktop horizontal overflow: 0
desktop Build → Battle → Reference: PASS
mobile errors: 0
mobile horizontal overflow: 0
mobile Build → Battle → Reference: PASS
mobile global Search: PASS
mobile primary targets at 390px: ~125 × 62px
mobile duplicate top mode switch: absent
```

The render loop caught and corrected duplicate mobile primary navigation, hidden mobile global Search, and a browser-only top-level script error before promotion. No new AIDB rule was added because existing clean-sheet/responsive/runtime proof gates caught the failures as intended.
