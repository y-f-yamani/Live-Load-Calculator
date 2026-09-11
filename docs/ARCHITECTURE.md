# Architecture

## Boundaries

`src/domain` is the trusted calculation boundary: pure functions receive validated project data and return loads, issues, comparisons and evidence completeness. It imports neither React nor browser APIs (except UUID generation in the factory module). Numerical units are SI internally: metres, kilograms, kilonewtons and square metres.

`src/infrastructure/storage.ts` validates JSON with Zod, limits file size, and handles browser persistence and downloads. Imported computed results are not accepted by the schema. The UI recomputes every result from the imported inputs and references.

`src/components` renders functional surfaces. `App.tsx` owns the current project, scenario selection and workflow. Language and appearance are separate device preferences; changing them must not change physical data or evidence snapshots.

`src/i18n/messages.ts` makes every Arabic message required by the English key type. Identifiers, unit symbols, formula values and floor coordinates do not mirror with RTL navigation. User-authored names and source references are preserved verbatim.

## Project data

One versioned project contains a floor shared by its scenarios. Each scenario contains machines, a concurrent distributed load, a documented-limit declaration and ten evidence records. Each machine has independent supports, contact areas and a reaction input mode.

Unknown numbers are `null`. Zero is an intentional known value. Estimated equal support loading is explicit and cannot complete the documented support evidence or enable the support-limit comparison.

Zod defines bounded counts, finite numeric values, required nested objects, enums and identifier uniqueness. File reads and writes both pass through the same schema and size boundary. Numerical user input accepts Western, Arabic-Indic and Eastern Arabic-Indic digits with explicit separator rules.

## Review invalidation

Reviewed limits record the exact physical context, site identity, code basis and supplied limits in a serialized snapshot. A changed site, machine, geometry, operating mode, concurrent load or limit invalidates that snapshot. These snapshots detect changed inputs; they are **not digital signatures** or proof of engineering review.

Evidence snapshots cover the inputs relevant to each evidence group. A document reference or checked state alone does not earn documentation credit: the group's inputs must be eligible and the evidence must be recorded for the current inputs. Changes to source text and notes clear the recorded snapshot through the UI.

Scenarios share floor geometry deliberately. Changing the floor therefore invalidates relevant evidence across all layouts. A duplicated scenario retains source references, but needs a new explicit limit-scope declaration.

## Results

The domain exposes:

1. `machineDemand` and `scenarioDemand`: derived loads and reaction balance.
2. `placementIssues`: geometry outside boundaries or crossing openings.
3. `scoreEvidence`: documentation completeness independent of structural status.
4. `assess`: scope checks and compatible comparisons, preserving any known exceedance.

The overall statuses are incomplete, outside scope, exceeded and within the checked limits. The latter only describes the supplied static comparisons and recorded evidence; it is not a structural design result. Required dynamic behavior is left unassessed.

## Extending the project

For a new floor solver, define a narrow supported structural system and required inputs, establish a reviewed calculation method, add pure solver modules and independent benchmark tests, then expose an explicit model selector. Keep it separate from the current supplied-limit comparison workflow. Do not silently reinterpret existing projects.

For schema changes, increment the schema version, supply a tested migration, and retain originals when migration fails. Keep input provenance, calculation-method version and scenario context in exports.

For an eventual backend, put repository/network adapters in infrastructure. Keep the domain independent of persistence. Authentication, authorization, audit history and private document storage would be separate features, not assumptions of the current local application.

The optional `read_current_floor_assessment` WebMCP tool exposes the current result read-only in supporting browsers. It is feature-detected and unregisters when the app unmounts. It never edits source data or approves an installation.
