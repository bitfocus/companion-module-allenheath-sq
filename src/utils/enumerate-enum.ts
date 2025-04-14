/**
 * Enumerate all the values of an enum `e` that has only string-valued members.
 *
 * @param e
 *   An `enum` to iterate over.  (Don't use this on values other than `enum`s.)
 * @returns
 *   A well-typed array of all the values of the enum.
 */
export function enumValues<E extends Record<string, string>>(e: E): E[keyof E][] {
	return Object.keys(e).map((name) => e[name as keyof E])
}
