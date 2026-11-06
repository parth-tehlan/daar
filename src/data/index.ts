// STUB — results agent replaces this. Public API of the data layer:
import type { Answers, Match, Project } from '../types';
/** ranked matches, best first (8–12 items) */
export function matchProjects(_a: Answers): Match[] {
  return [];
}
/** plausible size of the whole matching inventory, for the live onboarding count */
export function estimateInventory(_a: Answers): number {
  return 214;
}
export function getProject(_id: string): Project | undefined {
  return undefined;
}
