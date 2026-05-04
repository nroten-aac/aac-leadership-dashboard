import lawsJson from './seed-laws.json';
import phasesJson from './seed-actions-phases.json';
import type { Law, Phase, Action } from './types';

export const LAWS: Law[] = (lawsJson as any).laws as Law[];
export const PHASES: Phase[] = (phasesJson as any).phases as Phase[];
export const BUILTIN_ACTIONS: Action[] = (phasesJson as any).actions as Action[];

export const AAC_CONTEXT = {
  pastor: 'Pastor Nate Roten',
  coach: 'Jim Wiegland',
  church: 'Ashe Alliance Church',
  city: 'West Jefferson, NC',
  ageYears: 3.5,
  size: 72,
  newConvertsPastYear: 0,
};
