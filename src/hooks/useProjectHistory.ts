import { useCallback, useReducer, type SetStateAction } from 'react';
import { reduceHistory, type History } from '../domain/history';
import type { Project } from '../domain/schema';

export function useProjectHistory(initial: () => Project) {
  const [history, dispatch] = useReducer(
    reduceHistory<Project>,
    undefined,
    (): History<Project> => ({ past: [], present: initial(), future: [] }),
  );
  const setProject = useCallback(
    (value: SetStateAction<Project>) => dispatch({ type: 'set', value }),
    [],
  );
  return {
    project: history.present,
    setProject,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    undo: () => dispatch({ type: 'undo' }),
    redo: () => dispatch({ type: 'redo' }),
  };
}
