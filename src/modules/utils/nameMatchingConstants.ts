// How different (relative to name length) a candidate name is still allowed
// to be from an HRM employee's name before we stop suggesting it - beyond
// this ratio the name is treated as simply not present in the HRM export.
// Shared by every HRM name-matching util so typo tolerance stays consistent.
export const MAX_SUGGESTION_DISTANCE_RATIO = 0.4;
