# Zerg V2 — MAPS_L Bootstrap

- Target: `Zerg Army.dc.html` only
- Baseline: `cf1a68d591f5a256ce4fce5ac1e77cfc183e3859`
- Mode: AIDB Mode C / clean sheet
- Method: MAPS_L project bootstrap → AIDB council → isolated implementation → rendered proof
- Other faction/pages: explicitly out of scope

## Inspect reality

The incumbent Zerg page is a capable mobile-first army companion, but its information architecture exposes six equal destinations (`Roster`, `Battle`, `Library`, `Tactics`, `Brood`, `Codex`) inside a roughly 480px app column. Strong StarCraft styling is present, but army construction, live-game tracking, and reference lookup compete at the same navigation level.

Verified product capabilities that must survive:

- select engagement scale;
- select Zerg brood/faction card;
- add/remove units and choose legal purchasable tiers;
- manage upgrades;
- track minerals, vespene, supply, and slot capacity;
- select tactical cards;
- use a live round/phase/VP tracker;
- track deployment supply, deployed/reserve state, and model losses;
- search units/tactics/keywords/tags;
- inspect unit details and rules;
- save/load/import/export rosters;
- print an army sheet;
- preserve existing local-storage state and V4 migration boundary.

## DONE

A returning player can open the Zerg army surface and immediately understand which of three jobs they are doing:

1. **Build** — construct a legal swarm and understand remaining capacity.
2. **Battle** — operate the army at the table with round/phase/VP/deployment/casualty state close together.
3. **Reference** — find units, tactics, brood rules, keywords, and tags without those reference categories becoming primary app navigation.

The interface should remain recognizably Zerg without depending on a logo or decorative sci-fi chrome alone.

DONE proof:

- clean-sheet structure does not inherit the six-tab page architecture;
- existing state/storage capabilities remain represented;
- representative desktop render works with no horizontal overflow;
- representative 390px phone render works with no horizontal overflow;
- mobile primary targets are thumb-sized;
- Build, Battle, Reference, and global search are reachable on phone;
- browser runtime produces no JavaScript errors in representative fixtures;
- only the Zerg page and Zerg-V2-specific supporting assets are changed.

## Permission envelope

Authorized for this tester exercise:

- redesign and replace `Zerg Army.dc.html`;
- add Zerg-V2-specific CSS/JS/docs;
- preserve/reuse `zerg-data.js` and existing storage keys;
- push through to the tester's live `main` after proof passes.

Not authorized / not needed for this experiment:

- redesign Terran or Protoss;
- redesign Command Center, Missions, Rules, or UnitDetail;
- change game data/rules;
- change shared cross-army styling contracts;
- migrate other factions to the V2 architecture.

## Backcast roadmap

### Destination

A Zerg-specific three-job interface that is materially different from the incumbent and survives real desktop/mobile use.

### Required conditions working backward

1. Live page must preserve state and core capabilities.
2. Implementation must realize a frozen clean-sheet concept rather than restyle incumbent DOM.
3. Selected concept must survive incumbent resemblance gate.
4. Multiple materially different concepts must exist before selection.
5. Product behavior must be abstracted before concept generation.

### Execution order

1. inventory behavior and preservation contract;
2. generate three independent directions;
3. render representative desktop/mobile artifacts;
4. compare and freeze one concept;
5. implement in isolation with preserved state schema;
6. run responsive/runtime/interaction proof;
7. classify and fix any observed failures before promotion;
8. replace only `Zerg Army.dc.html` and promote tester live.

## Evidence-driven corrections before promotion

The proof loop caught three defects before release:

1. mobile duplicated `Build / Battle / Reference` at both top and bottom;
2. hiding the desktop utility group also hid global Search on phone;
3. a split browser script retained a top-level `return` that Node syntax checking did not expose as a browser-script problem.

All three were corrected before promotion. The existing AIDB/MAPS_L gates caught them, so they are implementation findings, not evidence that another normalized design rule is required.
