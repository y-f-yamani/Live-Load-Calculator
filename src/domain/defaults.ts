import { evidenceIds, type Machine, type Project, type Scenario } from './schema';

export const newId = () => crypto.randomUUID();

export function createSupports(width: number, length: number, count = 4): Machine['supports'] {
  return Array.from({ length: count }, (_, index) => {
    if (count === 1) return { id: newId(), x: 0, y: 0, area: null, reaction: null };
    if (count === 2)
      return {
        id: newId(),
        x: (index === 0 ? -1 : 1) * width * 0.35,
        y: 0,
        area: null,
        reaction: null,
      };
    const angle = (2 * Math.PI * index) / count + Math.PI / 4;
    return {
      id: newId(),
      x: Math.cos(angle) * width * 0.42,
      y: Math.sin(angle) * length * 0.42,
      area: null,
      reaction: null,
    };
  });
}

export function createMachine(name = 'Machine 01'): Machine {
  return {
    id: newId(),
    name,
    mass: null,
    contents: null,
    width: 2,
    length: 1.4,
    x: 4,
    y: 4,
    rotation: 0,
    supportType: 'feet',
    reactionMode: 'unknown',
    operation: 'unknown',
    supports: createSupports(2, 1.4),
  };
}

export function createScenario(): Scenario {
  return {
    id: newId(),
    name: 'Layout A',
    machines: [createMachine()],
    backgroundLoad: null,
    review: {
      reference: '',
      supportLimit: null,
      minContactArea: null,
      totalLimit: null,
      scopeConfirmed: false,
      signature: '',
    },
    evidence: Object.fromEntries(
      evidenceIds.map((key) => [key, { state: 'unknown', source: '', note: '', signature: '' }]),
    ) as Scenario['evidence'],
  };
}

export function createProject(example = true): Project {
  const scenario = createScenario();
  const machine = scenario.machines[0];
  if (example) {
    Object.assign(machine, {
      name: 'CNC milling machine',
      mass: 2000,
      contents: 0,
      width: 3,
      length: 2,
      x: 7,
      y: 5,
      operation: 'static',
      reactionMode: 'equal',
    });
    machine.supports = createSupports(3, 2).map((support) => ({ ...support, area: 0.01 }));
    scenario.backgroundLoad = 0;
  }
  return {
    schemaVersion: 1,
    name: example ? 'Mezzanine · equipment study' : 'Untitled assessment',
    site: '',
    codeBasis: '',
    isExample: example,
    floor: { width: 18, length: 12, type: 'unknown', udlRating: null, beams: [], openings: [] },
    scenarios: [scenario],
    activeScenarioId: scenario.id,
  };
}
