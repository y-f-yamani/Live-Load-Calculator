import { createProject } from '../domain/defaults';
import { evidenceIds, type Project, type Scenario } from '../domain/schema';
import { evidenceSignature, reviewSignature } from '../domain/evidence';
import { massToForce } from '../domain/numbers';

export function documentedFixture() {
  const project = createProject();
  project.isExample = false;
  project.site = 'TEST ONLY / Floor 1';
  project.codeBasis = 'Test fixture — not an engineering assessment';
  project.floor.type = 'steel';
  const scenario = project.scenarios[0];
  const machine = scenario.machines[0];
  machine.reactionMode = 'specified';
  machine.supports.forEach((s) => {
    s.reaction = massToForce(2000) / 4;
  });
  scenario.review = {
    reference: 'TEST ONLY',
    supportLimit: 5,
    minContactArea: 0.01,
    totalLimit: 25,
    scopeConfirmed: true,
    signature: '',
  };
  documentAll(project, scenario);
  return { project, scenario, machine };
}

export function documentAll(project: Project, scenario: Scenario) {
  scenario.review.signature = reviewSignature(project, scenario);
  for (const key of evidenceIds)
    scenario.evidence[key] = {
      state: 'documented',
      source: `TEST ONLY ${key}`,
      note: '',
      signature: evidenceSignature(key, project, scenario),
    };
}
