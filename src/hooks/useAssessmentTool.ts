import { useEffect, useRef } from 'react';
import type { Project } from '../domain/schema';
import { assess } from '../domain/assessment';

/** Optional progressive enhancement; unsupported browsers follow the normal UI. */
export function useAssessmentTool(project: Project) {
  const current = useRef(project);
  useEffect(() => {
    current.current = project;
  }, [project]);
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (tool: unknown, options: { signal: AbortSignal }) => unknown;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: 'read_current_floor_assessment',
            title: 'Read current floor assessment',
            description:
              'Read calculated loads, documentation completeness, missing information and the scope-limited result for the current visible layout. Does not approve installation.',
            inputSchema: { type: 'object', properties: {}, additionalProperties: false },
            annotations: { readOnlyHint: true, untrustedContentHint: true },
            execute(input: unknown) {
              if (
                !input ||
                typeof input !== 'object' ||
                Array.isArray(input) ||
                Object.keys(input).length
              )
                throw new Error('Expected an empty object');
              const p = current.current;
              const s = p.scenarios.find((item) => item.id === p.activeScenarioId)!;
              const result = assess(p, s);
              return {
                layout: s.name,
                status: result.status,
                machineLoadKn: result.demand.machineForce,
                dataCompletenessPercent: result.evidence.percent,
                issues: result.issues,
                scope: 'Static load planning; evidence score is not a probability of safety.',
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {
        /* Optional API must not disrupt the app. */
      });
    } catch {
      /* Optional API must not disrupt the app. */
    }
    return () => lifecycle.abort();
  }, []);
}
