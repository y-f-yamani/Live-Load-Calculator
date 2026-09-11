# Live Load Calculator

A bilingual workspace for planning machine loads on mezzanines and suspended floors. Place equipment on a scaled plan, calculate static loads, compare a documented arrangement with supplied engineering limits, and prepare an evidence-based report.

**English / العربية · Light / Dark / System · Runs entirely in your browser**

## Start locally

Requires **Node.js 22.12+** (Node 24 LTS recommended) and npm.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/**. The first project is clearly labeled as a fictional example with no established floor capacity. Choose **New project** for a blank assessment.

```sh
npm run check          # lint, unit/regression tests, TypeScript, production build
npm run test:watch     # test feedback during development
npm run test:coverage  # domain coverage report in coverage/
npm run format        # consistent formatting
npm run format:check
npm run preview       # serve the production build after npm run build
```

## Features

- Full English/Arabic interface, RTL layout, and English/Arabic/bilingual printable reports.
- Light, dark and system themes with independent saved language preferences.
- Interactive Three.js 3D editor with orbit/zoom/pan, direct dragging, rotation and resize handles, camera presets and fullscreen.
- Place machines, pallets, racks, tanks and blocks from an object library; edit dimensions, weight, supports, color and geometry locking.
- Add shared floor zones and existing wall, beam and column references; actual openings remain gaps in the 3D slab.
- Switch to the SVG 2D plan; both views use the same coordinates and load records.
- Duplicate/delete objects, undo/redo up to 40 project edits, and compare independent layouts.
- Explicit unknown values, machine contents, contact areas and supplier support reactions.
- Static weight, support-force and contact-pressure calculations with no inferred floor capacity.
- Reviewed support and combined-load comparisons for a recorded, matching static scenario.
- Ten-group **data confidence / evidence completeness** score with source references and stale-data detection.
- Browser autosave, validated versioned JSON import/export, and printable reports suitable for browser PDF export.
- Responsive layouts and accessible labels, keyboard controls, focus indicators and native dialogs.

## Scope of the engineering output

This release is **load planning and comparison against user-supplied documented limits**. It does not solve the floor structure or establish a building's capacity. It does not calculate slab punching, member resistance, connections, foundations, vibration, deflection, dynamic/impact loads, or transport-route adequacy.

A structural engineer must establish the actual building's applicable Saudi assessment basis and the limits for the specific machine arrangement. Generic floor ratings, building appearance, slab thickness, or machine footprint alone do not establish suitability. Do not use the application as installation approval.

The evidence percentage measures documented input coverage. **100% does not mean safe**, independently reviewed, or that every structural check passes. Unknown and assumed inputs earn no documentation credit. The app records source references; it does not authenticate documents.

See [calculation methodology](docs/CALCULATION_METHOD.md) for equations, numerical tolerances and limitations, and [the development plan](DEVELOPMENT_PLAN.md) for future engineering modules.

## Project structure

```text
.github/
  workflows/              CI and manually triggered GitHub Pages deployment
docs/
  ARCHITECTURE.md         Boundaries, data model, extension process
  CALCULATION_METHOD.md   Equations, scope, evidence rubric
  TESTING.md              Automated checks and manual acceptance checklist
src/
  components/            Floor editor, inspector, evidence, results and reports
  domain/                Pure calculation, geometry, assessment and evidence modules
  hooks/                 Preferences and optional read-only WebMCP integration
  i18n/                  Typed English/Arabic dictionaries
  infrastructure/        Validated local storage and project file boundary
  scene/                 Three.js meshes, transforms and disposable editor lifecycle
  test/                  Shared regression fixtures
  App.tsx                Application composition and project workflow
  main.tsx               React entry point
  styles.css             Semantic theme tokens, responsive and print styles
public/                  Public static assets
```

**Stack:** React, TypeScript (strict mode), Vite, Three.js, Zod, Lucide icons, Vitest, ESLint and Prettier. `package-lock.json` is committed for reproducible installation. Calculations have no dependency on React or browser storage.

## Saving and privacy

Projects remain in the current browser's local storage. No account, analytics, backend, external font service or file-upload service is used. **Export JSON backups** to move between browsers or devices; clearing browser data removes the local copy.

Project files use schema version 2 and have a 2 MB limit for both import and export. A project supports up to 12 scenarios, 30 load objects per scenario, 12 support points per object and 40 shared floor segments, subject to that file-size limit. Version 1 files are validated and migrated automatically: inputs and references are preserved, while evidence snapshots and review confirmation must be recorded again. The original version 1 browser save remains untouched as a backup. Invalid saved data is preserved while autosave is paused; starting/importing a project explicitly resumes saving.

## Using the 3D editor

Choose a preset from **Object library**, then click the floor to place it. Desktop users can also drag a preset into the view; **Add at center** provides a keyboard alternative. Select an item and use **Move**, **Rotate** or **Resize**; the inspector provides exact numerical dimensions and positions. Resizing updates support offsets proportionally without inventing weight or contact areas. Use the color swatches and lock control to organize the scene.

Drag empty space to orbit, scroll to zoom, and right-drag to pan. On a touch screen, use one finger to orbit and two fingers to zoom/pan. With the canvas focused, arrow keys move the selection, **R** rotates 15°, **Ctrl/Cmd+D** duplicates, **Delete** removes, and **Escape** cancels a gesture. Undo/redo buttons restore project changes; camera, language and theme remain separate preferences.

All load presets start with unknown weights and reactions. Preset silhouettes, heights, foot markers and slab thickness are illustrative. Floor zones organize the layout; existing structural references do not add strength, capacity or inferred weight. Represent newly added weighted elements as load objects. The editor does not simulate structural deflection or vibration.

3D requires WebGL2 and hardware acceleration. If unavailable, the project remains available in the 2D plan and numerical inspectors. Three.js is loaded in a separate lazy chunk (approximately 152 KB gzipped for the editor in this release).

Do not commit real facility information, engineering assessments, credentials, or exported user projects to a public repository. The committed example contains only fictional values.

## GitHub

Repository: [y-f-yamani/Live-Load-Calculator](https://github.com/y-f-yamani/Live-Load-Calculator)

The repository includes:

- CI on pushes and pull requests: locked install, formatting, lint, tests, type checking and production build.
- A **manually triggered** GitHub Pages workflow. To publish, enable **Settings → Pages → Source: GitHub Actions**, then run **Actions → Deploy to GitHub Pages → Run workflow**. No site deployment is triggered merely by uploading the source.
- Issue and pull-request templates, dependency update configuration, an EditorConfig and suggested VS Code settings.

The build uses relative asset paths and can also be hosted on another static host. Upload the contents of `dist/` after `npm run build`. Do not upload `node_modules/`; it is intentionally ignored. No secrets or environment variables are required for the app.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before changing calculation or assessment behavior. Keep evidence completeness separate from structural adequacy; add regression cases for any change to numerical results or review scope.

No open-source license has been selected. The repository owner should choose a license before offering reuse rights.
