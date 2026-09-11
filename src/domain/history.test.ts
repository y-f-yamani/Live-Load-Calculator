import { describe, expect, it } from 'vitest';
import { reduceHistory, type History } from './history';
describe('project history', () => {
  it('undoes a committed gesture and clears redo when a new edit is made', () => {
    let state: History<{ x: number }> = { past: [], present: { x: 1 }, future: [] };
    state = reduceHistory(state, { type: 'set', value: { x: 3 } });
    state = reduceHistory(state, { type: 'undo' });
    expect(state.present.x).toBe(1);
    state = reduceHistory(state, { type: 'redo' });
    expect(state.present.x).toBe(3);
    state = reduceHistory(state, { type: 'undo' });
    state = reduceHistory(state, { type: 'set', value: (p) => ({ x: p.x + 5 }) });
    expect(state.present.x).toBe(6);
    expect(state.future).toEqual([]);
  });
  it('ignores no-ops and bounds memory to 40 undo entries', () => {
    let state: History<number> = { past: [], present: 0, future: [] };
    expect(reduceHistory(state, { type: 'set', value: 0 })).toBe(state);
    for (let i = 1; i <= 60; i++) state = reduceHistory(state, { type: 'set', value: i });
    expect(state.past).toHaveLength(40);
    expect(state.past[0]).toBe(20);
  });
});
