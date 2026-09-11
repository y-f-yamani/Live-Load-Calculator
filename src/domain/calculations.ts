import type { Floor, Machine, Scenario } from './schema';
import { massToForce } from './numbers';

export function machineDemand(machine: Machine) {
  const mass =
    machine.mass === null || machine.contents === null ? null : machine.mass + machine.contents;
  const force = mass === null ? null : massToForce(mass);
  const reactions = machine.supports.map((support) =>
    machine.reactionMode === 'specified'
      ? support.reaction
      : machine.reactionMode === 'equal' && force !== null
        ? force / machine.supports.length
        : null,
  );
  const allKnown = reactions.every((reaction) => reaction !== null);
  const sum = allKnown ? (reactions as number[]).reduce((a, b) => a + b, 0) : null;
  // This MVP covers static vertical reactions only. Documented reactions must balance weight.
  const balanced =
    force !== null && sum !== null && Math.abs(force - sum) <= Math.max(0.01, force * 0.01);
  return {
    mass,
    force,
    reactions,
    balanced,
    averagePressure: force === null ? null : force / (machine.width * machine.length),
    pressures: reactions.map((reaction, i) =>
      reaction === null || machine.supports[i].area === null
        ? null
        : reaction / machine.supports[i].area!,
    ),
    peakReaction: allKnown ? Math.max(...(reactions as number[])) : null,
    isAssumed: machine.reactionMode === 'equal',
  };
}

export function scenarioDemand(scenario: Scenario, floor: Floor) {
  const machines = scenario.machines.map((m) => ({ id: m.id, ...machineDemand(m) }));
  const allKnown = machines.every((m) => m.force !== null);
  const machineForce = allKnown ? machines.reduce((sum, m) => sum + m.force!, 0) : null;
  // Gross floor area is deliberately used for the entered uniform load, including openings.
  const backgroundForce =
    scenario.backgroundLoad === null ? null : scenario.backgroundLoad * floor.width * floor.length;
  return {
    machines,
    machineForce,
    backgroundForce,
    totalForce:
      machineForce === null || backgroundForce === null ? null : machineForce + backgroundForce,
    peakReaction: machines.every((m) => m.peakReaction !== null)
      ? Math.max(...machines.map((m) => m.peakReaction!))
      : null,
  };
}
