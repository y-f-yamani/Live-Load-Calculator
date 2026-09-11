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
- SVG floor editor: drag, rotate, zoom, snap, keyboard movement, support lines and openings.
- Multiple machines and independent scenario copies for side-by-side comparison.
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
  test/                  Shared regression fixtures
  App.tsx                Application composition and project workflow
  main.tsx               React entry point
  styles.css             Semantic theme tokens, responsive and print styles
public/                  Public static assets
```

**Stack:** React, TypeScript (strict mode), Vite, Zod, Lucide icons, Vitest, ESLint and Prettier. `package-lock.json` is committed for reproducible installation. Calculations have no dependency on React or browser storage.

## Saving and privacy

Projects remain in the current browser's local storage. No account, analytics, backend, external font service or file-upload service is used. **Export JSON backups** to move between browsers or devices; clearing browser data removes the local copy.

Project files use schema version 1 and have a 2 MB limit for both import and export. A project supports up to 12 scenarios, 30 machines per scenario and 12 support points per machine, subject to that file-size limit. Storage failures are surfaced in the interface. Invalid saved data is preserved while autosave is paused; starting/importing a project explicitly resumes saving.

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
