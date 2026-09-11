import { z } from 'zod';

const id = z.string().min(1).max(100);
const label = z.string().max(160);
const positive = z.number().finite().positive().max(1e7);
const nonnegative = z.number().finite().min(0).max(1e9);
const nullable = nonnegative.nullable();

export const loadKinds = ['machine', 'pallet', 'rack', 'tank', 'block'] as const;
export const segmentKinds = ['zone', 'wall', 'beam', 'column'] as const;
export const sceneColors = ['teal', 'blue', 'amber', 'violet', 'slate', 'rose'] as const;
const sceneProperties = {
  height: positive.max(100),
  color: z.enum(sceneColors),
  locked: z.boolean(),
};

export const evidenceIds = [
  'identity',
  'geometry',
  'construction',
  'capacity',
  'path',
  'machine',
  'supports',
  'concurrent',
  'operation',
  'installation',
] as const;
export type EvidenceId = (typeof evidenceIds)[number];

const evidenceSchema = z
  .object({
    state: z.enum(['unknown', 'estimated', 'documented', 'conflicting']),
    source: z.string().max(2000),
    note: z.string().max(4000),
    signature: z.string().max(200000),
  })
  .strict();

const supportSchema = z
  .object({
    id,
    x: z.number().finite().min(-1000).max(1000),
    y: z.number().finite().min(-1000).max(1000),
    area: positive.nullable(),
    reaction: nullable,
  })
  .strict();

export const machineSchema = z
  .object({
    id,
    name: label,
    kind: z.enum(loadKinds),
    ...sceneProperties,
    mass: nullable,
    contents: nullable,
    width: positive.max(1000),
    length: positive.max(1000),
    x: z.number().finite().min(-1000).max(1000),
    y: z.number().finite().min(-1000).max(1000),
    rotation: z.number().finite().min(0).max(359.999),
    supportType: z.enum(['feet', 'wheels', 'skids', 'base']),
    reactionMode: z.enum(['unknown', 'equal', 'specified']),
    operation: z.enum(['static', 'rotating', 'impact', 'moving', 'unknown']),
    supports: z.array(supportSchema).min(1).max(12),
  })
  .strict()
  .refine(
    (m) => new Set(m.supports.map((s) => s.id)).size === m.supports.length,
    'Duplicate support IDs',
  );

export const segmentSchema = z
  .object({
    id,
    name: label,
    kind: z.enum(segmentKinds),
    x: z.number().finite().min(-1000).max(1000),
    y: z.number().finite().min(-1000).max(1000),
    width: positive.max(1000),
    length: positive.max(1000),
    rotation: z.number().finite().min(0).max(359.999),
    elevation: z.number().finite().min(-100).max(100),
    ...sceneProperties,
  })
  .strict();

export const floorSchema = z
  .object({
    width: positive.max(1000),
    length: positive.max(1000),
    type: z.enum(['unknown', 'concrete', 'steel', 'other']),
    udlRating: nullable,
    segments: z.array(segmentSchema).max(40),
    beams: z
      .array(z.object({ id, axis: z.enum(['x', 'y']), position: nonnegative }).strict())
      .max(40),
    openings: z
      .array(
        z
          .object({ id, x: nonnegative, y: nonnegative, width: positive, length: positive })
          .strict(),
      )
      .max(20),
  })
  .strict();

export const scenarioSchema = z
  .object({
    id,
    name: label,
    machines: z.array(machineSchema).min(1).max(30),
    backgroundLoad: nullable,
    review: z
      .object({
        reference: z.string().max(2000),
        supportLimit: positive.nullable(),
        minContactArea: positive.nullable(),
        totalLimit: positive.nullable(),
        scopeConfirmed: z.boolean(),
        signature: z.string().max(200000),
      })
      .strict(),
    evidence: z.record(z.enum(evidenceIds), evidenceSchema),
  })
  .strict()
  .refine(
    (s) => new Set(s.machines.map((m) => m.id)).size === s.machines.length,
    'Duplicate machine IDs',
  );

export const projectSchema = z
  .object({
    schemaVersion: z.literal(2),
    name: label,
    site: label,
    codeBasis: z.string().max(500),
    isExample: z.boolean(),
    floor: floorSchema,
    scenarios: z.array(scenarioSchema).min(1).max(12),
    activeScenarioId: id,
  })
  .strict()
  .superRefine((p, ctx) => {
    if (!p.scenarios.some((s) => s.id === p.activeScenarioId)) {
      ctx.addIssue({ code: 'custom', message: 'Active scenario does not exist' });
    }
    for (const items of [p.scenarios, p.floor.beams, p.floor.openings, p.floor.segments]) {
      if (new Set(items.map((item) => item.id)).size !== items.length) {
        ctx.addIssue({ code: 'custom', message: 'Duplicate IDs' });
      }
    }
    for (const opening of p.floor.openings) {
      if (
        opening.x + opening.width > p.floor.width ||
        opening.y + opening.length > p.floor.length
      ) {
        ctx.addIssue({ code: 'custom', message: 'Opening outside floor' });
      }
    }
    for (const beam of p.floor.beams) {
      if (beam.position > (beam.axis === 'x' ? p.floor.width : p.floor.length)) {
        ctx.addIssue({ code: 'custom', message: 'Beam outside floor' });
      }
    }
  });

export type Machine = z.infer<typeof machineSchema>;
export type Floor = z.infer<typeof floorSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type Segment = z.infer<typeof segmentSchema>;
export type LoadKind = (typeof loadKinds)[number];
export type SegmentKind = (typeof segmentKinds)[number];
export type SceneColor = (typeof sceneColors)[number];
