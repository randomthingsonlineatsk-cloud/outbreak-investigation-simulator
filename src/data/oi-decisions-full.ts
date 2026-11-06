import type { Decision, Scenario, StageKey } from './oi-types'
import { buildDecisions as buildBaseDecisions } from './oi-decisions'
import { extraDecisions, adjustDecisions } from './oi-decisions-extra'
import { moreDecisions } from './oi-decisions-more'

// The decision list the app actually uses: the base decisions (generic plus
// earlier scenario-flag decisions), adjusted, plus the extension decisions,
// plus the newest decisions from oi-decisions-more.ts.
export function buildDecisions(scenario: Scenario, stage: StageKey): Decision[] {
  const base = adjustDecisions(scenario, stage, buildBaseDecisions(scenario, stage))
  return [...base, ...extraDecisions(scenario, stage), ...moreDecisions(scenario, stage)]
}
