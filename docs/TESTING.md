# Testing and release checks

## Automated checks

Run `npm ci` followed by `npm run check`. CI uses the committed lockfile. `npm run test:coverage` produces a domain coverage report; coverage percentages are software metrics, not engineering confidence.

Regression cases cover:

- Force/unit conversions, unknown inputs, unequal supplier reactions and balance tolerance.
- Contact pressure versus footprint-average loading.
- Missing capacity, irrelevant UDL ratings, mismatched contacts and assumed reactions.
- Valid exceedances preserved despite missing evidence.
- 100% evidence alongside failed comparisons or unassessed dynamic operation.
- Stale review scope after geometry, machine, site and code changes.
- Rotation, boundaries, openings and overlapping footprints.
- Western/Arabic/Persian digits and malformed numeric input.
- JSON versions, invalid numbers, nested structure, duplicate IDs, scope and size constraints.
- Storage errors, corrupted-data preservation, round-trip equality and language-key parity.
- Static rendering of localized reports and preservation of small contact areas.

## Manual browser acceptance checklist

This checklist is provided for release testing. Automated domain tests and server rendering do not replace an interaction or visual browser pass.

- [ ] In English/light, Arabic/light, English/dark and Arabic/dark, check labels, forms, warnings and diagram readability at desktop and phone widths.
- [ ] Switch language/theme after moving and rotating a machine. Coordinates, loads, score and evidence status remain unchanged.
- [ ] Follow the system theme, then select a manual override and reload.
- [ ] Move a machine with pointer/touch and keyboard. Check snap, rotation, zoom and reset.
- [ ] Enter Arabic digits and valid group separators, then invalid/ambiguous numbers. Invalid drafts remain visible and block export/report until corrected.
- [ ] Add supports, enter known reactions, cross an opening or floor boundary, and compare layouts.
- [ ] Document evidence, change a related input, and verify stale evidence is visible.
- [ ] Record scoped test limits, then change the site. Both reviewed comparisons become unassessed.
- [ ] Export JSON, reload it and compare inputs/results; invalid imports preserve the current project.
- [ ] Open a corrupt saved project and verify autosave stays paused until an explicit New/Open action.
- [ ] Print English, Arabic and bilingual reports; inspect page breaks, RTL tables, small areas, source notes and scope messages.
- [ ] Test 200% browser zoom, keyboard focus, native help-dialog dismissal and screen-reader labels.

Use fictional values for software testing. Before real assessment use, a qualified structural engineer must review the methods, terminology, evidence requirements and supported limits workflow using documented examples.
