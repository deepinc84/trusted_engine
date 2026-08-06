# CODEX TASK — REPLACE THE FAILED ESTIMATOR WITH A WORKBOOK-FAITHFUL, FULLY EDITABLE ENGINE

You are working in the Trusted Roofing repository. The existing estimator UI and its rate-application behaviour are not trusted. Do not add another workflow. Replace the primary estimating experience.

The following supplied artifacts are authoritative:
- `mega_estimator_formula_map.json` — extracted formulas, values and option mappings from the actual Mega template, completed asphalt estimate and completed Euroshield estimate.
- `mega_estimator_line_items.csv` — concise line-item map.
- `Trusted_Estimator_Workbook_Specification.md` — implementation rules and fixture totals.
- the three original `.xlsm` files — final reference when a mapped rule needs visual/cell verification.

## Governing rule
EVERY CALCULATION IS AUTOMATIC. EVERY CALCULATED VALUE IS EDITABLE.

Company defaults seed a new estimate. Estimate-level values are snapshots/overrides. Recalculation must never silently overwrite a manual estimate-level value. Provide Reset to Default and Save as Company Default separately.

## First action
Before changing UI, add a test-only workbook regression fixture from the JSON map. Implement the engine until it reproduces the workbook-derived inputs, quantities, subtotals and project totals. Do not touch proposal styling until engine tests pass.

## Calculation engine
Implement explicit typed rules for the `B 1` roofing rows represented in the JSON, including materials rows 12–39, labour rows 41–69, general requirements 72–90, contingency/profit/total rows 90–94. Never apply a rate because its unit text matches. Every row requires an explicit quantity source and activation rule.

All purchasable material order quantities use:
`orderQty = requiredQty <= 0 ? 0 : ceil((requiredQty / coverage) * allApplicableMultipliers)`
where the mapped workbook uses equivalent order of operations. Store required quantity, raw order quantity, rounded order quantity and override quantity separately. Extension uses the effective rounded/overridden order quantity.

Pitch labour maps only to the matching pitch area. Include all pitch rows present in `Input!4:20`. Rates are editable at estimate level.

Optional switches from the workbook, including chimney work, ground drop, extra ice and water, cut-in vents, ridge vent, high-definition cap, wall/step flashing, travel, hotel and per diem, must be explicit toggles. Defaults come from the workbook/template.

## Numeric input behaviour
Do not bind an empty text box directly to numeric zero. During editing, store a string draft. Show `placeholder="0"`. Allow deletion to blank. Parse on blur/save/calculation. Blank calculates as zero but remains blank in the field until the user enters a value. Do not create `0125` or restore `0` after each keystroke.

## UI
Replace the existing estimator workspace; do not preserve it as Advanced. Function over appearance. Use one practical continuous worksheet with sections:
1. Customer/property
2. Structures/buildings
3. Pitch-area and roof measurements
4. Option tabs: Good, Better, Best, Custom
5. Editable Materials table
6. Editable Labour table
7. Editable General Requirements/Add-ons table
8. Totals and final selling price
9. Scope selections
10. Generate proposal

Tables must show: included/activation, item, source quantity, required quantity, waste/multiplier, coverage, raw order quantity, rounded order quantity, effective editable quantity, unit cost/rate and extension. Every field that was editable in Excel must be editable here. Hide only workbook cells that are purely intermediate calculations; expose their meaningful result and calculation details.

No hover-hidden buttons, no readiness dashboard, no tender/project/change-order tabs, no catalogue administration in the quoting flow, no wizard, and no separate proposal editor.

## Defaults and options
Seed Good/Better/Best from the actual workbook mappings, not guessed names. The JSON records asphalt and Euroshield product selections per option. Allow any row product, coverage, cost, waste and quantity to be changed on the estimate. Custom options may clone an existing option and then change products/rates.

## Proposal
After the engine is validated, generate the premium Trusted proposal from selected scope clauses. The internal estimator remains worksheet-like and functional; the customer proposal remains highly polished and detailed. Scope clauses are predetermined but selectable, reorderable and editable.

## Required tests
1. Parse/load the mapped Signal Hill measurements: total 3287 sq ft; 2/12=4, 5/12=94, 7/12=3156, 9/12=33; ridges/hips=320; valleys=153; rakes=47; eaves=259; transition=1; goosenecks=3; Oatey=1; B vents=3; step flashing=53; wall flashing=30; chimney backpan=1.
2. Assert every active material row's source quantity and raw formula against JSON.
3. Assert material purchase quantities use upward whole-unit rounding in the new engine; document expected differences from cached workbook quantities.
4. Assert only matching pitch labour rows activate.
5. Assert optional rows remain zero unless selected.
6. Assert estimate overrides survive measurement edits and reopening.
7. Assert Reset to Default restores the current company default.
8. Assert Save as Company Default affects future estimates only unless explicitly applied to the current one.
9. Assert the workbook-comparison mode can reproduce cached workbook subtotals before intentional ceiling corrections: asphalt T94=28778.02304; Euroshield T94=53513.47300000001.
10. Add corrected-order regression snapshots showing the new totals after ceiling every purchasable unit.

## Completion gate
Run lint, typecheck, tests and production build. Do not declare completion until the formula-map coverage report shows every active roofing row implemented or intentionally excluded with a written reason. Output:
- files changed
- routes replaced
- database changes
- implemented row count / total mapped row count
- workbook fixture comparison
- corrected ceiling-rounding comparison
- screenshots of the full estimator at desktop width
- confirmation that all actions are visible without hover

Do not add unrelated features. Do not guess missing formulas. When a rule is unclear, inspect the source `.xlsm` cell and its dependencies, then encode it explicitly.
