# Calculation method — static-load-1.0

This document describes the implemented product logic. It is not a code-compliance certificate or an engineering assessment of a particular floor.

## Units and load calculation

- Input mass: kg; the UI can display tonnes and converts them to kg before storing.
- Geometry: m; support contact area: m².
- Force: kN; pressure: kPa, equivalent to kN/m².
- Standard gravitational acceleration used: 9.80665 m/s².

```text
operating mass = machine mass + contents and attachments
weight (kN) = operating mass (kg) × 9.80665 / 1000
footprint average (kPa) = weight / (machine width × machine length)
support contact pressure (kPa) = support reaction (kN) / contact area (m²)
other distributed force = entered distributed load × gross floor width × gross floor length
combined applied force = sum of machine weights + other distributed force
```

The distributed load uses gross floor area, including openings. The label and report disclose this convention. Structural self-weight is not inferred or added by the calculator: supplied limits must already be an applicable allowance that accounts for self-weight and other required actions. Entered concurrent loads must be covered by the same assessment basis.

An illustrative 2,000 kg machine has 19.6133 kN weight. Four explicitly assumed equal reactions are 4.903325 kN each. For 0.01 m² contact per foot, pressure is 490.3325 kPa. For a 4 m² machine footprint, the footprint average is 4.903325 kPa. The latter is descriptive and is not used to approve concentrated machine loads.

## Support reactions

Three modes are available:

- **Unknown:** no inferred reaction values.
- **Equal sharing:** a user-selected illustration only, labeled as an assumption.
- **Supplier reactions:** the entered static vertical forces remain unchanged; the app never redistributes them.

For the static model, reactions must sum to the calculated weight within the larger of 0.01 kN or 1% of that weight. This is an input-consistency tolerance, not a design factor. Additional applied operating forces, eccentric stiffness-dependent distribution, uplift and dynamics require other assessment methods; those analyses are not implemented.

Support contact areas are scalar values. Support markers show their centers and are not scaled contact polygons. An engineer's assessment must cover the actual contact shape, edges, openings and load spreading. A baseplate's full area is not automatically an effective uniform bearing area.

## Supplied-limit comparisons

Only documented **service-level** limits are accepted by this workflow:

1. Maximum support reaction, with the minimum applicable support contact area.
2. Maximum combined applied force for the exact simultaneous arrangement and entered concurrent loads.

The reference must explicitly cover the location, support/contact arrangement, simultaneous supports, static operation and relevant concurrent loads. The user records that scope against a snapshot of the current project. The app cannot verify the reference's authenticity, professional validity or scope; it records the declaration.

Support checks also require supplied, balanced reactions and contact areas at least as large as the stated minimum. A smaller or unknown area leaves the support comparison unassessed and flags a scope issue. Known applicable exceedances remain visible even if other evidence is incomplete.

Changes to building identity, code basis, geometry, machine data, operating behavior, limits or concurrent loading invalidate the reviewed context. Generic distributed ratings are recorded for reference only. No universal dynamic or safety multiplier is used.

## Evidence rubric — evidence-1.0

Ten predefined evidence groups each contribute ten documentation points when eligible, sourced, declared documented and recorded for the current relevant inputs. The rubric is a product measure, not a reliability model:

1. Identity and assessment basis.
2. Geometry and placement.
3. Construction and condition.
4. Applicable capacity limits.
5. Complete load-path coverage.
6. Maximum operating mass and contents.
7. Contact geometry and support reactions.
8. Existing and concurrent loading.
9. Operating conditions.
10. Installation and temporary loading.

The denominator stays fixed at ten for this floor-assessment workflow. There is no user-controlled way to remove missing groups. Any exclusions must be recorded in the source's scope and remain visible in the report. Estimates, conflicts, missing references and stale snapshots do not earn points.

The score measures input documentation. It neither proves independent engineering verification nor resolves an unimplemented analysis. Even 100% may accompany an exceedance or an incomplete dynamic assessment.

## Geometry

Machine corners and support centers rotate about the machine center. Convex footprint intersection uses the separating-axis test. A 1e-8 m-scale numerical comparison tolerance is used for boundaries. Touching machine outlines are not considered overlapping; required installation/maintenance clearance is not calculated.

Support lines are visual references only. Machines outside the floor, over openings or overlapping other machines cannot receive a favorable supplied-limit result. Member load sharing and the load path are not inferred from the drawing.

## Engineering development references

Saudi code applicability must be confirmed by a structural engineer for each actual building and assessment. Planning references:

- [Saudi Building Code system overview](https://www.sbc.gov.sa/En/MediaCenter/Lists/SBCDigitalLibraryDocuments/Saudi%20Building%20Code%20System.pdf).
- [ICC structural analysis and complete load-path principles](https://codes.iccsafe.org/s/IBC2018/chapter-16-structural-design/IBC2018-Ch16-Sec1604.4).
- [ACI discussion of assessment of existing concrete buildings](https://www.concrete.org/frequentlyaskedquestions.aspx?faqid=856).

The international references explain engineering principles; they do not substitute for the applicable Saudi requirements. Future structural modules require independent engineering validation before operational use.
