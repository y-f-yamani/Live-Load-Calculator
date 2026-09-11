export type History<T> = { past: T[]; present: T; future: T[] };
export type HistoryAction<T> =
  { type: 'set'; value: T | ((current: T) => T) } | { type: 'undo' | 'redo' };

export function reduceHistory<T>(state: History<T>, action: HistoryAction<T>): History<T> {
  if (action.type === 'undo') {
    if (!state.past.length) return state;
    return {
      past: state.past.slice(0, -1),
      present: state.past[state.past.length - 1],
      future: [state.present, ...state.future],
    };
  }
  if (action.type === 'redo') {
    if (!state.future.length) return state;
    return {
      past: [...state.past, state.present],
      present: state.future[0],
      future: state.future.slice(1),
    };
  }
  if (action.type !== 'set') return state;
  const next =
    typeof action.value === 'function'
      ? (action.value as (current: T) => T)(state.present)
      : action.value;
  if (JSON.stringify(next) === JSON.stringify(state.present)) return state;
  return { past: [...state.past.slice(-39), state.present], present: next, future: [] };
}
