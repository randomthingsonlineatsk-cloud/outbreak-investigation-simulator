// ---------------------------------------------------------------------------
// Release stage: which batch of the roadmap the published app exposes.
//
//   1 = roadmap items 1 to 30 (the core simulator)
//   2 = items 1 to 52 (adds outbreak of the week, hints, badges, NPC
//       conversations, fresh numbers, self-check, flashcards, the curve
//       gallery, the certificate and summary, the methods appendix, and the
//       second batch of scenarios)
//
// The code for both batches lives in the project. Stage 1 simply does not
// show the second batch. To publish the second batch, change this to 2 and
// publish again.
// ---------------------------------------------------------------------------

export const RELEASE_STAGE: 1 | 2 = 2
