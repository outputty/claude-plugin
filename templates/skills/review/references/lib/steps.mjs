/** The steps of the review skill each mode must show, so the build can see which one a report skipped. */

/** Step numbers of the review skill's Steps per mode; the post and the status script add their own. */
export const REQUIRED_STEPS = { review: [2, 3], docs: [2, 7], master: [2, 4, 5], recheck: [8, 9] };

/** The required steps a list of {step, did, evidence} does not show: no entry, or one without its did or evidence. */
export function missingSteps(mode, steps) {
  const required = REQUIRED_STEPS[mode];
  // A mode the skill does not know has no steps to compare, so it is the caller's error.
  if (!required) throw new Error("unknown mode " + mode + ", expected " + Object.keys(REQUIRED_STEPS).join("|"));
  return required.filter(
    (number) => !steps.some((entry) => entry.step === number && entry.did?.trim() && entry.evidence?.trim()),
  );
}

/** One line per step the review took: its number, what it did and the evidence for it. */
export function renderSteps(steps) {
  return steps.map((entry) => "Step " + entry.step + ": " + entry.did + " - " + entry.evidence);
}
