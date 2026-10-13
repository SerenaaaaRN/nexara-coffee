/** Escape wildcard LIKE (`%`, `_`, `\`) so user input always matches literally. */
export const escapeLikePattern = (input: string) =>
	input.replace(/[\\%_]/g, (m) => `\\${m}`);

/** Wrap an escaped term in a `%term%` pattern for `ilike`. */
export const containsPattern = (term: string) =>
	`%${escapeLikePattern(term)}%`;
