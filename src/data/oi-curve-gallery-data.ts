import type { CurveShape, EpiCurveDay } from './oi-types'

// ---------------------------------------------------------------------------
// Annotated curve gallery (#49). Eight epidemic-curve patterns, each drawn
// with numbered callouts explaining what to look for.
//
// These curves are ILLUSTRATIVE: stylized to show one pattern clearly, not
// data from any specific real outbreak. Each annotation points at bars whose
// values actually show what the text claims, and that is checked in tests
// (peaks are peaks, plateaus are plateaus, the step really is a step).
// ---------------------------------------------------------------------------

export interface CurveAnnotation { days: number[]; label: string; text: string }

export interface GalleryCurve {
  id: string
  title: string
  short: string
  // Which teaching category the curve belongs to. 'other' is for patterns
  // that are not one of the three standard classes (bimodal, artifact,
  // point source with secondary spread).
  shape: CurveShape | 'other'
  curve: EpiCurveDay[]
  annotations: CurveAnnotation[]
  summary: string
  recognize: string[]
  pitfall: string
  // A scenario in the simulator that shows this pattern, if there is one.
  scenarioId?: string
}

const series = (values: number[]): EpiCurveDay[] => values.map((cases, day) => ({ day, cases }))

export const GALLERY: GalleryCurve[] = [
  {
    id: 'point-source', title: 'Point source: one shared meal', short: 'Point source', shape: 'point_source', scenarioId: 'ridgeview-wedding',
    curve: series([0, 2, 14, 31, 18, 7, 2, 1]),
    summary: 'Everyone was exposed at about the same time, so onsets bunch together and the whole curve spans roughly one incubation period.',
    annotations: [
      { days: [3], label: 'Peak', text: 'Most people fell ill within a narrow window, because they were exposed together. The height of the peak reflects how many were exposed and how contaminated the source was.' },
      { days: [1, 2, 3, 4], label: 'Rise and fall within one incubation period', text: 'Onsets spread out around the median because people differ in how quickly they develop symptoms. The rise is usually quicker than the fall.' },
      { days: [6, 7], label: 'Long tail', text: 'A few people with longer incubation periods, or secondary cases, trail off. A tail like this is normal and is not by itself evidence of continuing exposure.' },
    ],
    recognize: ['One sharp peak', 'A rapid rise and a slower fall', 'The whole curve spans about one incubation period'],
    pitfall: 'The peak day is not the exposure day. Work backward from onset by the incubation period to find when exposure most likely happened.',
  },
  {
    id: 'point-secondary', title: 'Point source followed by secondary spread', short: 'Point + secondary', shape: 'other',
    curve: series([0, 3, 17, 26, 13, 5, 2, 6, 9, 4, 1]),
    summary: 'A single exposure produced the main wave, then a smaller second wave appeared about one incubation period later.',
    annotations: [
      { days: [3], label: 'Primary wave', text: 'The tall first peak is the point-source exposure: many people ill at once from a shared source.' },
      { days: [5, 6], label: 'The trough', text: 'The dip between the waves is where the two mechanisms separate. It shows the first wave was not simply continuing.' },
      { days: [7, 8], label: 'Smaller second wave', text: 'A second bump roughly one incubation period after the first suggests some primary cases passed the illness on. Look for illness among household members of early cases.' },
    ],
    recognize: ['A tall first peak', 'A clear dip', 'A smaller second peak about one incubation period later'],
    pitfall: 'Treating the second wave as a separate outbreak. It usually belongs to the same investigation, and it changes the control measures you need.',
  },
  {
    id: 'continuous', title: 'Continuous common source: an ongoing contaminated supply', short: 'Continuous source', shape: 'continuous_common_source', scenarioId: 'lakeside-infusion',
    curve: series([2, 5, 9, 12, 11, 13, 10, 12, 11, 9, 4, 1]),
    summary: 'People keep being exposed for as long as the source is active, so cases keep arriving day after day.',
    annotations: [
      { days: [0, 1, 2], label: 'Gradual start', text: 'The rise is gradual because exposure builds up as more people are affected and word starts to spread.' },
      { days: [3, 4, 5, 6, 7, 8], label: 'Plateau', text: 'Cases keep arriving because people keep being exposed. A plateau much longer than one incubation period points to an ongoing source rather than a single event.' },
      { days: [10, 11], label: 'Decline after the source is fixed', text: 'Cases fall about one incubation period after the source is removed or treated. That lag is the incubation period, not a sign the fix failed.' },
    ],
    recognize: ['A long plateau', 'No single sharp peak', 'A fall that lags the fix by about one incubation period'],
    pitfall: 'Calling it propagated because it lasts a long time. Duration alone does not distinguish continuous exposure from person-to-person spread; look for regular waves.',
  },
  {
    id: 'intermittent', title: 'Intermittent common source: contamination that comes and goes', short: 'Intermittent source', shape: 'continuous_common_source', scenarioId: 'meadowbrook',
    curve: series([3, 4, 14, 6, 3, 12, 15, 5, 2, 1]),
    summary: 'The source is contaminated only some of the time, so cases arrive in bursts with lulls in between.',
    annotations: [
      { days: [2], label: 'First surge', text: 'A burst of cases followed by a lull suggests contamination that is present only some of the time, for example after heavy rain.' },
      { days: [3, 4], label: 'Lull', text: 'Cases fall while the source is temporarily clean. Compare the timing of surges with events such as rainfall, deliveries, or equipment failures.' },
      { days: [5, 6], label: 'Second surge', text: 'A second burst days later, again without one clean peak, is the signature of recurring rather than one-time exposure.' },
    ],
    recognize: ['Several irregular peaks', 'Lulls between them', 'Peaks that line up with an environmental event'],
    pitfall: 'Reading the surges as generations of person-to-person spread. Waves from spread are evenly spaced; surges from a source line up with events.',
  },
  {
    id: 'propagated', title: 'Propagated: successive waves', short: 'Propagated', shape: 'propagated', scenarioId: 'eastview-hall',
    curve: series([1, 3, 2, 1, 4, 9, 4, 2, 7, 15, 8, 3, 5, 7, 2]),
    summary: 'The illness spreads from person to person, so each wave of cases seeds the next one.',
    annotations: [
      { days: [1], label: 'First generation', text: 'The first small wave: a few people who were infected from an outside source or an index case.' },
      { days: [5], label: 'Second generation', text: 'People infected by the first wave become ill about one generation later, and there are more of them.' },
      { days: [9], label: 'Peak generation', text: 'The wave grows while many people are still susceptible and in close contact with cases.' },
      { days: [1, 5, 9, 13], label: 'Even spacing between waves', text: 'The gap between peaks is roughly one generation interval: the incubation period plus the time until an ill person passes it on.' },
      { days: [13], label: 'Later, smaller wave', text: 'Waves shrink as susceptible people are used up or control measures take hold.' },
    ],
    recognize: ['Repeating peaks', 'Roughly even spacing between them', 'Waves that grow at first'],
    pitfall: 'Expecting a single vehicle. In person-to-person spread there is usually no one shared food or water to find, so interview about contacts, not just meals.',
  },
  {
    id: 'bimodal', title: 'Two exposures: a double-peaked curve', short: 'Two exposures', shape: 'other', scenarioId: 'crestwood-retreat',
    curve: series([0, 3, 17, 9, 2, 0, 1, 4, 15, 7, 2]),
    summary: 'Two separate exposure events a few days apart, each producing its own point-source-shaped peak.',
    annotations: [
      { days: [2], label: 'First peak', text: 'A first exposure event, such as a meal on the first day.' },
      { days: [5], label: 'The gap', text: 'The gap between peaks is longer than the spread of one peak. Ask whether the two events share a source before assuming person-to-person spread.' },
      { days: [8], label: 'Second peak', text: 'A second exposure event a few days later, for example another function using the same contaminated equipment. It has the same sharp shape as the first, which is not what propagated waves look like.' },
    ],
    recognize: ['Two distinct peaks', 'Each peak sharp and narrow', 'A gap with few or no cases between them'],
    pitfall: 'Concluding it is propagated because there are two peaks. Check whether both events could trace to the same source.',
  },
  {
    id: 'artifact', title: 'Surveillance artifact: a step, not a peak', short: 'Artifact', shape: 'other', scenarioId: 'ridgemont-artifact',
    curve: series([3, 4, 3, 3, 11, 12, 10, 12, 11, 12]),
    summary: 'Reported cases jump to a new level at one moment and stay there, because how cases were found or counted changed.',
    annotations: [
      { days: [0, 1, 2, 3], label: 'Baseline', text: 'The usual low level before anything changed.' },
      { days: [4], label: 'The step', text: 'Counts jump at one moment and stay high, with no rise and fall. A real outbreak almost always rises and then declines.' },
      { days: [5, 6, 7, 8, 9], label: 'A new plateau', text: 'A sustained new level that coincides with a new test, a reporting change, or a revised case definition suggests the counting changed, not the illness. Confirm with exposure data: odds ratios all near 1.' },
    ],
    recognize: ['An abrupt step up', 'A sustained new level with no decline', 'Timing that matches a change in testing or reporting'],
    pitfall: 'Chasing a source that is not there. Before investigating a vehicle, check whether anything about the way cases are detected has changed.',
  },
  {
    id: 'vector', title: 'Vector-borne: a seasonal hump', short: 'Vector-borne', shape: 'continuous_common_source', scenarioId: 'palm-grove',
    curve: series([1, 2, 4, 7, 10, 12, 11, 8, 5, 3, 1]),
    summary: 'A broad, gentle hump over weeks, following the season and the vector population.',
    annotations: [
      { days: [0, 1, 2], label: 'Slow build', text: 'Mosquito or tick populations build gradually, so cases do too.' },
      { days: [5], label: 'Broad peak', text: 'A wide, gently rising and falling hump with no sharp peak fits ongoing exposure to a source that grows and shrinks with conditions such as rain and temperature.' },
      { days: [8, 9, 10], label: 'Decline', text: 'Cases fall as conditions change or control measures reduce vector numbers.' },
    ],
    recognize: ['A broad, rounded hump', 'A long build and a long decline', 'A link to season or weather'],
    pitfall: 'Looking for a shared meal or a person-to-person chain. Ask about place, time outdoors, and breeding sites instead.',
  },
]
