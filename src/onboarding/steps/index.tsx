import type { ComponentType } from 'react';
import type { Answers } from '../../types';
import { AreasStep } from './AreasStep';
import { BudgetStep } from './BudgetStep';
import { FinancingStep } from './FinancingStep';
import { HandoverStep } from './HandoverStep';
import { PrioritiesStep } from './PrioritiesStep';
import { PurposeStep } from './PurposeStep';
import { SizeStep } from './SizeStep';
import type { StepProps } from './types';

export interface StepDef {
  title: (a: Answers) => string;
  helper: (a: Answers) => string;
  valid: (a: Answers) => boolean;
  Component: ComponentType<StepProps>;
  wide?: boolean;
}

const always = () => true;

export const STEPS: StepDef[] = [
  { title: () => 'What is it for?', helper: () => 'We weigh every project differently depending on the answer.', valid: (a) => a.purpose !== null, Component: PurposeStep },
  { title: () => "What's the budget?", helper: () => 'The full purchase price. Payment plans spread it across construction.', valid: always, Component: BudgetStep },
  {
    title: (a) => (a.purpose === 'office' ? 'How much floor space?' : 'How many bedrooms?'),
    helper: (a) => (a.purpose === 'office' ? 'Net internal area. Most off-plan office floors split from 600 sq ft.' : 'Pick every size that works.'),
    valid: always,
    Component: SizeStep,
  },
  { title: () => 'When do you need the keys?', helper: () => 'Developers here deliver a median five months after the promised date. We account for that.', valid: always, Component: HandoverStep },
  { title: () => 'How will you pay?', helper: () => 'This changes which payment plans suit you.', valid: (a) => a.financing !== null, Component: FinancingStep },
  { title: () => 'Where in Dubai?', helper: () => 'Leave it empty to see the whole city.', valid: always, Component: AreasStep, wide: true },
  { title: () => 'What matters most?', helper: () => 'Pick up to three, most important first.', valid: always, Component: PrioritiesStep },
];
