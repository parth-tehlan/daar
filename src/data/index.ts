// Public API of the placeholder data layer.
import type { Answers, Match, Project } from '../types';
import { PROJECTS } from './projects';
import * as m from './match';

/** ranked matches, best first (up to 10) */
export function matchProjects(a: Answers): Match[] {
  return m.matchProjects(a);
}
/** plausible size of the whole matching inventory, for the live onboarding count */
export function estimateInventory(a: Answers): number {
  return m.estimateInventory(a);
}
export function getProject(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}
/** extras for the results panel: score any single project, even if it isn't in the top list */
export { scoreOne, previewReasons, matchGroups } from './match';
export { estimatedHandover } from './match';
export { getDeveloper } from './developers';
export { PROJECTS } from './projects';
