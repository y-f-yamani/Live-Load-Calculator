import { projectSchema, type Project } from '../domain/schema';
const STORAGE_KEY = 'live-load.project.v1';
const MAX_BYTES = 2_000_000;

function checkSize(json: string) {
  if (new TextEncoder().encode(json).length > MAX_BYTES)
    throw new Error('Project file exceeds 2 MB');
}

export function serializeProject(project: Project): string {
  const json = JSON.stringify(projectSchema.parse(project), null, 2);
  checkSize(json);
  return json;
}

export function parseProject(json: string): Project {
  checkSize(json);
  return projectSchema.parse(JSON.parse(json));
}

export function loadProject(): { project: Project | null; error: boolean } {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    return { project: json ? parseProject(json) : null, error: false };
  } catch {
    return { project: null, error: true };
  }
}

export function saveProject(project: Project): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, serializeProject(project));
    return true;
  } catch {
    return false;
  }
}

export function downloadProject(project: Project) {
  const blob = new Blob([serializeProject(project)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.name.replace(/[^\p{L}\p{N}_-]/gu, '-').slice(0, 60) || 'assessment'}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
