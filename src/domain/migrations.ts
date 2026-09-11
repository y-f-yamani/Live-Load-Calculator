import { projectSchema as legacySchema } from './legacy/v1';
import { projectSchema, type Project } from './schema';

/** Validate the old format before upgrading; never silently accept future formats. */
export function migrateProject(value: unknown): Project {
  if (value && typeof value === 'object' && 'schemaVersion' in value && value.schemaVersion === 1) {
    const legacy = legacySchema.parse(value);
    return projectSchema.parse({
      ...legacy,
      schemaVersion: 2,
      floor: { ...legacy.floor, segments: [] },
      scenarios: legacy.scenarios.map((scenario) => ({
        ...scenario,
        machines: scenario.machines.map((machine) => ({
          ...machine,
          kind: 'machine',
          height: 1.5,
          color: 'teal',
          locked: false,
        })),
        review: { ...scenario.review, scopeConfirmed: false, signature: '' },
        evidence: Object.fromEntries(
          Object.entries(scenario.evidence).map(([key, evidence]) => [
            key,
            { ...evidence, signature: '' },
          ]),
        ),
      })),
    });
  }
  return projectSchema.parse(value);
}
