import { describe, expect, it } from 'vitest';
import { createProject } from './defaults';
import { machineDemand, scenarioDemand } from './calculations';
import { massToForce } from './numbers';

describe('static load calculations', () => {
  it('distinguishes total force, footprint average, support reactions and contact pressure', () => {
    const p = createProject();
    const m = p.scenarios[0].machines[0];
    m.width = 2;
    m.length = 2;
    const d = machineDemand(m);
    expect(d.force).toBeCloseTo(19.6133, 8);
    expect(d.reactions).toHaveLength(4);
    expect(d.reactions[0]).toBeCloseTo(4.903325, 8);
    expect(d.averagePressure).toBeCloseTo(4.903325, 8);
    expect(d.pressures[0]).toBeCloseTo(490.3325, 8);
    expect(d.isAssumed).toBe(true);
  });
  it('uses supplier reactions without redistributing unequal loads', () => {
    const m = createProject().scenarios[0].machines[0];
    m.reactionMode = 'specified';
    const fractions = [0.4, 0.3, 0.2, 0.1];
    m.supports.forEach((s, i) => {
      s.reaction = massToForce(2000) * fractions[i];
    });
    const d = machineDemand(m);
    expect(d.balanced).toBe(true);
    expect(d.reactions[0]).toBeCloseTo(7.84532);
    expect(d.reactions[3]).toBeCloseTo(1.96133);
    expect(d.isAssumed).toBe(false);
  });
  it('retains unknown weight, contents, reactions and contact areas', () => {
    const m = createProject(false).scenarios[0].machines[0];
    const d = machineDemand(m);
    expect(d.force).toBeNull();
    expect(d.peakReaction).toBeNull();
    expect(d.pressures).toEqual([null, null, null, null]);
    m.mass = 2000;
    expect(machineDemand(m).force).toBeNull();
    m.contents = 0;
    expect(machineDemand(m).force).toBeCloseTo(19.6133);
  });
  it('flags inconsistent reactions without silently normalizing them', () => {
    const m = createProject().scenarios[0].machines[0];
    m.reactionMode = 'specified';
    m.supports.forEach((s) => {
      s.reaction = 3;
    });
    expect(machineDemand(m).balanced).toBe(false);
    expect(machineDemand(m).reactions).toEqual([3, 3, 3, 3]);
  });
  it('includes contents and known concurrent loads exactly once', () => {
    const p = createProject();
    const s = p.scenarios[0];
    s.machines[0].contents = 500;
    s.backgroundLoad = 1;
    const d = scenarioDemand(s, p.floor);
    expect(d.machineForce).toBeCloseTo(24.516625);
    expect(d.backgroundForce).toBe(216);
    expect(d.totalForce).toBeCloseTo(240.516625);
    s.backgroundLoad = null;
    expect(scenarioDemand(s, p.floor).totalForce).toBeNull();
  });
});
