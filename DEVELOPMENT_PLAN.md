# Live Load Calculator: Machine and Floor Assessment

Development proposal — 11 September 2026. Planning only; application development awaits the user's requested go-ahead.

## Purpose and first release

Help non-specialists in Saudi Arabia describe an existing elevated floor, place machines on a scaled plan, understand the loads they introduce, compare scenarios, and prepare a traceable assessment for a structural engineer. The central question is: **Can this specific floor support this machine, in this position, under these operating and installation conditions?**

Recommend an HTML/CSS/JavaScript application with a polished 2D simulator first. Start with load calculation and comparison against documented, engineer-reviewed limits. Add structural analysis for a narrowly defined floor system after independent engineering validation.

The user confirmed Saudi Arabia and wants an application that collects each future user's inputs, without requiring the user to be a specialist or restricting the interface to one floor type. The interface will offer concrete, steel mezzanine, other, and “I don't know” choices with illustrations. Floor construction still determines the engineering method; accepting different floor types does not imply that every type has an implemented capacity calculation. First-release requirements include metric units, a desktop-first responsive interface, full English/Arabic support, light/dark themes, a data-confidence percentage in results, and local project saving. No default floor capacity will be supplied. A real building or machine is not required to begin developing the prototype.

## Engineering basis

Use a Saudi assessment framework: SBC 301 for structural loading and SBC 901 for relevant existing-building assessment provisions, together with the applicable material and foundation codes. The structural engineer must confirm the edition and provisions applicable to each project. The official Saudi code collection announces implementation of its 2024 edition from 30 June 2025; the app should retain the actual building and assessment code references rather than infer them solely from its age. The source checks here establish the planning framework, not a completed clause-by-clause code implementation. [Saudi Building Code collection](https://sbc.gov.sa/ar/bc/pages/buildingcode/BCDetails.aspx?codeId=501&year=2018), [Saudi code system overview](https://www.sbc.gov.sa/En/MediaCenter/Lists/SBCDigitalLibraryDocuments/Saudi%20Building%20Code%20System.pdf)

The following international sources explain engineering principles; they are not a substitute for the applicable Saudi requirements.

A machine's mass divided by its footprint is insufficient to establish floor suitability. The assessment must consider the actual points of load application, member and connection response, and the complete load path. ICC's structural analysis provisions explicitly address these principles. The applicable local code and edition must be established separately. [ICC: Structural analysis and load path](https://codes.iccsafe.org/s/IBC2018/chapter-16-structural-design/IBC2018-Ch16-Sec1604.4)

Vibration is also a separate assessment: a strength result does not establish acceptable operating vibration. AISC identifies vibrating machinery among the sources that require consideration. [AISC: Floor vibration guidance](https://www.aisc.org/architecture-center/newsletter/)

For existing concrete floors, the investigation and assessment basis must reflect the existing structure and its condition. ACI explains the complementary roles of its existing-structure assessment and concrete design provisions; the project engineer selects the applicable basis. [ACI: Evaluating existing concrete buildings](https://www.concrete.org/frequentlyaskedquestions.aspx?faqid=856)

The software supports a qualified structural engineer's assessment. Installation decisions require verification of the actual building and machine; an attractive simulation cannot establish unknown capacity.

## Design for a non-specialist

Use a short guided questionnaire with a progress indicator. Ask everyday questions first, explain why each answer matters, and offer “I don't know” for technical information. Unknown answers allow the user to continue preparing the project while keeping the assessment incomplete.

| What the app asks                                                       | How it helps the user                                                                                                     |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Where will the machine go: mezzanine, upper floor, or another location? | Illustrate an elevated floor versus a slab directly on the ground; route other systems to the appropriate scope           |
| What does the floor look like?                                          | Illustrated concrete/steel/other/unknown choices; explain that appearance alone does not confirm construction             |
| How large is the area?                                                  | Enter length and width in metres with a simple measuring diagram                                                          |
| How heavy is the machine when fully loaded?                             | Accept kg or metric tonnes; explain dry weight versus fluids, materials, tooling, and attachments; point to supplier data |
| How does it touch the floor?                                            | Illustrated feet, wheels, skids, and full-base options; ask for count and dimensions with diagrams                        |
| Does it rotate, vibrate, strike, or move?                               | Simple choices determine which operating information is needed                                                            |
| What else will be on this floor?                                        | Add other machines, stored goods, people, and temporary installation equipment                                            |
| Do you have a floor rating or structural report?                        | Explain where to obtain it; distinguish a general loading sign from a machine-specific assessment                         |
| Where will you place it, and how will it get there?                     | Position it visually and record the delivery route for review                                                             |

Keep reinforcement, steel sections, load combinations, and engineering limits in a separate technical-details section populated from documents or by an engineer. Never require an operator to guess them. Offer a “What to request” information sheet addressed to the building owner and machine supplier; users can export and share it themselves.

The result should answer three practical questions: **What do we know? What remains unverified? What should I do next?** Include the requested confidence percentage as **Data confidence — evidence completeness**, with its calculation and missing items visible. This measures the documented input evidence for the stated assessment scope; it is not a probability of structural safety or a statistical confidence interval. Keep the structural result separate, as specified below.

## What information the user needs

| Information         | Required details                                                                                                                                                          | Typical source                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Project             | Site, floor identification, intended use, country, assessment date, applicable code and edition                                                                           | Owner and structural engineer                       |
| Floor geometry      | Boundary, dimensions, beam/column positions, spans, openings, machine position                                                                                            | Structural drawings and site verification           |
| Floor construction  | Steel/concrete/other system; deck or slab type; thickness; beam sizes and spacing; support arrangement                                                                    | As-built drawings and structural engineer           |
| Structural capacity | Verified distributed and concentrated limits, their locations, applicable contact areas, simultaneous load restrictions, operating restrictions, and assessment reference | Existing engineering assessment or a new assessment |
| Existing loads      | Other equipment, storage, partitions, finishes, people, and foreseeable temporary loads                                                                                   | Site survey and project records                     |
| Machine             | Dry and operating mass; contents, tooling and attachments; dimensions; operating modes                                                                                    | Manufacturer's documentation                        |
| Supports            | Feet/wheels/base arrangement; support coordinates and contact areas; manufacturer reactions; center of gravity where available                                            | Manufacturer's installation drawings                |
| Dynamic conditions  | Speed/frequency, forcing or impact data, start/stop behavior, isolators and anchorage                                                                                     | Manufacturer and structural engineer                |
| Installation        | Transporter and machine weights, wheel/axle loads, route, temporary storage, lifting or jacking arrangements                                                              | Installation contractor and structural engineer     |
| Condition           | Inspection date; damage, deterioration, modifications, and evidence gaps                                                                                                  | Competent site inspection                           |

Every critical input records its units, source, date, and whether it is documented, estimated, or unknown. A general floor loading sign can be recorded, but does not establish machine point-load capacity or complete structural suitability.

If information is unavailable, produce a load schedule and a specific missing-information list. Do not guess reinforcement, floor capacity, beam sizes, support reactions, or condition.

## User journey and interface

1. **Create floor:** enter dimensions, select floor construction, draw supports and openings, and attach evidence references. An optional scaled background plan can be traced manually.
2. **Add machine:** enter operating mass, dimensions, feet/wheels/base, reactions where available, and operating conditions.
3. **Place equipment:** drag and rotate the machine on the floor plan or enter precise coordinates. Display actual support points as well as its outline.
4. **Add surrounding loads:** existing machines, storage areas, occupied areas, and relevant temporary loads.
5. **Compare scenarios:** save layouts A/B, change positions or machine contents, and examine the resulting load schedule and applicable checks.
6. **Review results:** display each calculation, evidence gap, applicable limit, and unassessed check alongside the data-confidence percentage and its breakdown. Critical missing evidence remains prominent regardless of the percentage.
7. **Export assessment:** save the project and generate a printable report in English, Arabic, or both, with the layout, inputs, assumptions, results, confidence breakdown, and engineer review fields.

Suggested desktop layout:

| Left: inputs                             | Center: simulator                                                   | Right: assessment                                                               |
| ---------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Floor, machine, supports, existing loads | Scaled plan; columns, beams, openings, machine feet and load arrows | Total force, individual support loads, applicable comparisons, missing evidence |
| Units and source references              | Drag, rotate, zoom, snap, exact coordinates                         | Plain-language explanation and next action                                      |
| Scenario selector                        | Optional simple isometric view later                                | Data confidence, missing evidence, report and project export                    |

Use clear dimensions and readable cards. Statuses require text and icons as well as color. On smaller screens, switch between Inputs, Plan, and Results. Coordinate fields must provide an accessible alternative to dragging. Keep language and appearance controls accessible in the main header, independently of the project workflow.

## English and Arabic requirements

- Full language switching from the first release, covering navigation, guided questions, help, validation messages, simulator labels, result explanations, confidence breakdowns, and reports. Keep user-entered names and original evidence documents unchanged.
- Use English left-to-right and Arabic right-to-left layouts, with suitable fonts and enough space for both languages. Changing language must retain inputs, selection, and the current scenario.
- Keep mathematical expressions, unit symbols, identifiers, and mixed-language values readable using appropriate text direction. Accept Western and Arabic-Indic digits and normalize them to the same internal numeric values; define and validate decimal/group separators explicitly instead of guessing ambiguous entries.
- Mirror navigation and interface layout for Arabic, while preserving actual floor geometry, support coordinates, axes, rotation, dimensions, and calculation results. A language change must never move a machine.
- Save the selected language locally. Offer English, Arabic, or bilingual report export independently of the interface language, with the same underlying values and conclusions.
- Keep translation dictionaries separate from calculations. Have Arabic engineering terminology and decision wording reviewed before operational use.

## Light and dark theme requirements

- Provide **Light / Dark / System** appearance choices from the first release. Default to the system preference until the user chooses an override, and remember their choice locally.
- Light theme: neutral light surfaces, dark navy text, and teal primary controls. Dark theme: deep slate surfaces, light text, and matching teal accents. Use shared semantic color tokens for both themes.
- Theme the whole experience: forms, diagrams, floor grid, machine outlines, support markers, charts, tooltips, dialogs, focus indicators, result cards, and confidence display.
- Preserve status meaning across themes and use text/icons with color. Keep dimensions, small annotations, warnings, and keyboard focus clearly readable in both themes.
- Switching appearance must preserve all inputs, scenario state, scores, and calculations. Language and theme preferences are independent.
- Generate reports with a dedicated light print style regardless of the selected on-screen theme, with legible grayscale output and no dark page backgrounds.

## Confidence percentage and missing inputs

Implement the requested percentage as **Data confidence — evidence completeness**. Suggested Arabic label: **ثقة البيانات — اكتمال الأدلة**. Show a short explanation next to it: “How much of the required input evidence is documented. This is not the probability that the floor is safe.” Translate this explanation in Arabic as well.

The initial scoring rubric is a proposed product measure, not a structural reliability model or a requirement taken from a building code. Use a transparent checklist rather than invented probabilities:

`Data confidence (%) = 100 × documented applicable evidence requirements / total applicable evidence requirements`

Use these ten evidence groups as the initial checklist requirements; define the required items inside each group for the selected assessment method. A group counts as documented only when all its required items meet the evidence rules. When all ten apply, each completed group represents ten percentage points. These are equal documentation credits, not equal measures of structural importance.

| Evidence group                       | What must be covered                                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| 1. Assessment identity and scope     | Building/floor identification, jurisdiction, scenario, and applicable assessment basis                |
| 2. Geometry                          | Floor geometry, actual supports, openings, and machine position                                       |
| 3. Construction and condition        | Relevant structural construction, inspection evidence, and known changes or deterioration             |
| 4. Capacity basis                    | Applicable building-specific assessed limits or the resistance basis for a supported structural model |
| 5. Load-path coverage                | Evidence covering the required supporting members, connections, and downstream supports               |
| 6. Machine operating weight          | Machine mass, contents, tooling, and relevant attachments                                             |
| 7. Machine supports                  | Contact geometry, positions, and applicable support reactions                                         |
| 8. Concurrent loading                | Existing and reasonably anticipated loads acting with the machine                                     |
| 9. Operation                         | Applicable operating forces, vibration/impact information, and operating restrictions                 |
| 10. Installation and other scenarios | Applicable transport, staging, maintenance, and temporary loading information                         |

- Define and version the checklist for the floor type, intended assessment, and load scenario. Group requirements around the machine and operating load, support loading, floor geometry, capacity/model evidence, existing loads, condition, and applicable operational/installation conditions. Include all evidence necessary for the stated scope; do not remove requirements because the software cannot yet perform their checks.
- Count a requirement as documented only when its required fields are complete, source references are recorded, the evidence applies to the scenario, and there is no unresolved inconsistency. An upload alone does not establish applicability or independently verify a document. Record whether a person has reviewed the evidence separately.
- Missing, unknown, estimated, assumed, or conflicting requirements contribute zero documented items. List estimates separately so users can explore scenarios without mistaking them for documented facts. Do not assign arbitrary partial credit to guessed inputs.
- Use equal credit per predefined evidence requirement in the initial rubric. Required groups and granularity are fixed by the rubric, not by how many form fields the user fills in. Optional metadata, duplicated documents, or additional photos cannot inflate the score.
- Exclude a requirement as not applicable only through a supported scope rule with its reason recorded. An unanswered question or a user deleting a field cannot reduce the denominator. Show “Not calculated” if the applicable scope/checklist is not yet established or its denominator is zero.
- Display an integer percentage together with the exact count, such as “70% — 7 of 10 evidence requirements documented.” Avoid rounding an incomplete result up to 100%; reserve 100% for all applicable requirements documented. Show the rubric version and assessment scope in the detail view and export.
- Treat missing critical evidence as a separate blocking condition. For example, missing floor capacity, required support-load information, load-path coverage, concurrent loads, or required operating/dynamic evidence keeps the floor assessment incomplete even with a high score. No percentage threshold may override a known exceedance, an unsupported model, or an unassessed required check.
- A score of 100% means the required input evidence is documented under the selected rubric. It does not establish that the structure passes, that evidence has been independently verified, or that all analysis has been completed. Fully documented inputs can still produce an exceedance.
- Scores are specific to the stated scope. A complete machine-weight estimate cannot supply a confidence percentage for floor suitability. Excluding installation from a stationary operating assessment must visibly limit the result to operation; it does not cover moving the machine into place. Show one clearly labeled floor-assessment score in the main result, and label any optional subtask scores separately. Compare scores only under compatible scopes and rubric versions.
- Recalculate the score, evidence gaps, and structural status when relevant inputs, sources, scope, or evidence review state change. Preserve the previous score only with its previous scenario revision; never carry a review forward to changed inputs silently.

Example result card, using fictional values solely to illustrate wording:

| Result field     | Display                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| Floor assessment | Incomplete — capacity evidence missing                                                                   |
| Data confidence  | 70% — 7 of 10 required evidence items documented                                                         |
| Missing evidence | Floor capacity for this load arrangement, machine foot reactions, applicable operating-force information |
| Next action      | Request the floor assessment from the owner/engineer and support/operating loads from the supplier       |

The score detail shows documented, estimated, missing, conflicting, and not-applicable items; the reason each item is needed; and how to obtain the evidence. Export the same percentage, count, missing items, scope, and explanation with the result. Keep its visual style neutral so a high percentage does not resemble structural approval.

## Calculation and result rules

**Demand mode:** calculate operating weight, documented support reactions, and contact pressures. Display footprint-average loading only as an explanatory quantity. Keep permanent, variable, and dynamic actions separate; the engineer establishes classification and combinations under the selected code. Avoid double counting existing loads or deducting them from a rating whose basis is unknown.

For an illustrative static example, a 2,000 kg machine has a weight of approximately 19.61 kN. If four feet share that load equally, each reaction is approximately 4.90 kN. With four 100 × 100 mm feet, each contact pressure is approximately 490 kPa. Averaging the same weight over a 2 × 2 m footprint gives approximately 4.90 kPa. These values describe different things and are not interchangeable capacity checks. Equal foot loading is an explicit example assumption, not a default fact about a real machine.

Use `force_kN = mass_kg × 9.80665 / 1000` and `contact_pressure_kPa = reaction_kN / contact_area_m2`. Do not compare foot contact pressure directly with a distributed floor load rating. Do not assume a baseplate spreads load uniformly without an appropriate verified model.

**Verified-limit comparison mode:** enable comparisons only when the supplied engineering limits cover the entered load pattern, position, contact area, simultaneous loads, and operating conditions. Store each limit's basis: service/allowable or factored/design, its units, and its restrictions. Compare like quantities on the same basis. An isolated point-load allowance is not automatically valid for several simultaneous machine feet.

**Future structural mode:** calculate demand through a validated model and compare it with appropriately established resistance and serviceability limits. Needed checks depend on the floor system and can include local deck/slab bending, bearing and punching shear, beam bending and shear, deflection, connections, columns, foundations, stability, anchorage, and vibration. Unimplemented checks remain explicitly unassessed.

Each check has one of four states:

- **Not assessed:** information or a supported analysis method is missing.
- **Outside assessment scope:** the scenario violates the documented conditions of the supplied model or limits.
- **Exceeds reviewed limit:** a valid comparison exceeds its applicable limit.
- **Within reviewed limit:** a valid comparison is within its applicable limit for the stated scenario.

Show an overall incomplete status when necessary checks remain unassessed. Always retain any known exceedance in the summary. Do not label a layout simply “safe,” show an unsupported remaining capacity in tonnes, or treat missing values as zero. The data-confidence percentage describes evidence coverage and cannot change these assessment rules. Editing a reviewed scenario invalidates the earlier review status.

## Simulator scope

The first release simulates **load placement and scenario changes**: move a machine, rotate its supports, change contents, and add nearby loads. Show support forces and their locations. A color overlay may show calculated applied loading; it must identify its quantity and units and must not imply stress or floor capacity.

Later engineering simulation can show beam response, calculated deflection, and validated operating vibration. Predicted deformation needs a documented structural model, material properties, boundary conditions, and a displayed visual magnification factor. A vibration animation needs a dynamic model, forcing, damping, and acceptance criteria; speed or machine mass alone is insufficient. Avoid a universal arbitrary “dynamic factor.”

Installation routes, rolling loads, lifting/jacking, and start/stop transients should be recorded in the first release for review. Their automated analysis belongs in later validated modules. Do not automatically recommend relocating near a column or adding a spreader plate as a remedy without checking that proposed scenario.

## Development stages and completion gates

| Stage                     | Deliverable                                                                                                                                                                                                                                                 | Completion gate                                                                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Confirm basis          | Saudi context, non-specialist workflow, illustrated input questions, evidence rules, and clearly fictional example cases                                                                                                                                    | Agree the scope and what constitutes sufficient evidence; no real machine data needed to begin                                                               |
| 2. Visual prototype       | Responsive English/Arabic interface, RTL support, light/dark/system themes, scaled floor editor, machine supports, dragging/rotation, sample layouts, sample confidence card                                                                                | User can reproduce the example layout in either language and theme; sample data is clearly identified                                                        |
| 3. Load calculator MVP    | Unit-safe demand calculations, source tracking, scenario comparison, validated limits entry, status rules, versioned confidence checklist and percentage, local save/import/export, localized printable reports                                             | Numerical and workflow checks pass; scores are reproducible and explainable; missing critical data cannot produce a positive assessment                      |
| 4. Engineering validation | Independent structural review under the applicable Saudi requirements, documented calculation basis, review of critical evidence requirements and score wording, a documented real example, comparison with hand calculations or established analysis tools | Qualified engineer accepts the supported scope and benchmark tolerances; non-specialists understand that the evidence percentage is not a safety probability |
| 5. Structural expansion   | One defined floor system and governing code at a time, then relevant dynamic and installation modules                                                                                                                                                       | Each added capability independently verified before real assessment use                                                                                      |

The useful first deliverable is Stages 2–3, with assessment claims constrained by Stage 4. Full analysis of arbitrary steel, concrete, timber, and composite floors should be treated as separate development modules.

## Proposed implementation

- HTML5 and CSS for a responsive interface; modular JavaScript for behavior and a separate calculation engine.
- SVG for the initial scaled interactive floor plan. Add a 3D library only when an isometric view adds value.
- Modules for projects/evidence, unit conversion, geometry, machine supports, load cases, comparisons, result status, evidence-checklist scoring, localization, appearance preferences, and reporting.
- Central English/Arabic translation keys, explicit locale-aware input parsing/formatting, and document language/direction settings. Store calculation values independently of display language.
- CSS custom properties for semantic theme tokens and direction-aware layout styles; persist language and light/dark/system preferences separately from engineering inputs.
- Versioned JSON import/export and browser storage for local projects; exported backups remain available. No account or server is necessary for the first release.
- Print-specific HTML/CSS for English, Arabic, and bilingual reports that the browser can save as PDF, including RTL layout and a consistent light print palette.
- Persist units, source references, model/calculation version, scenario revision, review scope, confidence rubric version, checklist states, score/count, critical gaps, and timestamps with every result. Preserve full calculation precision and round only for display.

No automatic drawing interpretation or AI-generated structural capacity in the first release. Evidence attachments and manually verified data can support the workflow.

## Verification and acceptance criteria

1. Verify unit conversions and independent benchmark calculations, including the illustrative 2,000 kg example.
2. Check supplied reactions against the stated load case and flag inconsistencies. Never silently rebalance manufacturer data. Account for additional forces where the load case requires them.
3. Test unequal supports, rotation, multiple machines, openings, floor edges, and placements outside the defined model or reviewed zones.
4. Reject invalid numbers, zero/negative dimensions, incompatible limit bases, and malformed project imports; preserve unknown data explicitly.
5. Demonstrate that a distributed rating alone cannot yield a complete machine assessment and that missing dynamic checks remain visible.
6. Validate agreement between on-screen results, saved/reloaded projects, and exported reports, including source evidence and limitations.
7. Verify keyboard operation, responsive layout, status readability, and report pagination.
8. For any structural solver, test equilibrium, known analytical cases, relevant member/local checks, numerical convergence where applicable, and independently agreed accuracy tolerances. Keep regression benchmarks for each supported model.
9. Trial the complete workflow with a documented real case reviewed by a qualified structural engineer before presenting it as a real assessment tool.
10. Test with non-specialists: they can enter a machine, identify or mark unknown supports, position it, and correctly explain an incomplete result without mistaking it for permission to install.
11. Verify English/Arabic and light/dark combinations, system-theme behavior, translated errors/tooltips/exports, mixed-direction labels, and persistent preferences. Confirm language/theme changes cannot alter machine coordinates, numerical values, or results.
12. Verify equivalent Western and Arabic-Indic numeric inputs, defined decimal/group separators, invalid/ambiguous input handling, and identical values in English, Arabic, and bilingual reports.
13. Test confidence scoring with no documented evidence, partial evidence, all documented evidence, estimates, contradictions, scope changes, and valid not-applicable rules. Verify no optional fields or duplicate documents inflate the score, and no empty denominator produces 100%.
14. Test a high score with missing critical floor capacity, a 100% score with an exceeded structural limit, and a 100% input score with an unimplemented required check. Each must retain the correct independent structural result and next action.
15. Verify score/count, checklist version, scope, missing items, and critical gaps survive save/reload and match the printed report. Confirm language and theme changes leave the score unchanged and incomplete scores never round to 100%.
16. Have non-specialists explain a sample confidence result in both languages: they must understand that it measures documented evidence and does not state a probability of safe installation. Revise wording and presentation if they confuse the two.

## Immediate next step

With the user's requested go-ahead, develop the guided HTML prototype and load-calculation MVP for non-specialists in Saudi Arabia, including English/Arabic, light/dark/system themes, and the explained data-confidence percentage, using clearly identified fictional examples. The application itself will collect floor and machine details from each user. It can calculate known load demands and produce an engineer-ready information pack even when actual floor capacity is unavailable. Add verified-limit comparisons and separately validated structural modules as the necessary engineering basis becomes available.
