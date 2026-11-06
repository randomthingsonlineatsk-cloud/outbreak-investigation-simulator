import type { Scenario } from './oi-types'
import { ASHGROVE_SCENARIO, FAIRPORT_SCENARIO, UNION_PLAZA_SCENARIO, RIDGEMONT_SCENARIO } from './oi-scenario-skepticism'
import { HALDEN_SCENARIO, LINDENWOOD_SCENARIO } from './oi-scenario-clusters'
import { BELLWETHER_SCENARIO, QUILLFEATHER_SCENARIO } from './oi-scenario-stats'
import { NORTHFIELD_SCENARIO, PINEHURST_SCENARIO } from './oi-scenario-bias'
import { LAKEVIEW_SCENARIO } from './oi-scenario-matched'
import { RELEASE_STAGE } from './oi-release'

// Later-batch scenarios. Add new ones here rather than in oi-scenarios.ts,
// which holds the original large scenario literals.
//
// Stage 1 includes only Lindenwood (OI-25), the two-outbreaks-in-one-setting
// curveball that roadmap item 4 asks for. The rest arrive with stage 2, in
// this order (the order also fixes the outbreak-of-the-week rotation).
const STAGE_2_SCENARIOS: Scenario[] = [
  ASHGROVE_SCENARIO, FAIRPORT_SCENARIO, UNION_PLAZA_SCENARIO, RIDGEMONT_SCENARIO,
  HALDEN_SCENARIO, LINDENWOOD_SCENARIO,
  BELLWETHER_SCENARIO, QUILLFEATHER_SCENARIO,
  NORTHFIELD_SCENARIO, PINEHURST_SCENARIO,
  LAKEVIEW_SCENARIO,
]

export const MORE_SCENARIOS: Scenario[] = RELEASE_STAGE >= 2 ? STAGE_2_SCENARIOS : [LINDENWOOD_SCENARIO]
