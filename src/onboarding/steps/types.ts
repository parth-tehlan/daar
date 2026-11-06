import type { Answers } from '../../types';

export interface StepProps {
  answers: Answers;
  patch: (p: Partial<Answers>) => void;
}
