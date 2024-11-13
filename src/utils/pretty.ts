/** Pretty-print a byte value. */
export function prettyByte(b: number): string {
	return b.toString(16).toUpperCase().padStart(2, '0')
}

/** Pretty-print an array of bytes. */
export function prettyBytes(message: readonly number[]): string {
	return message.map(prettyByte).join(' ')
}

/** Pretty-print multiple arrays of bytes. */
export function manyPrettyBytes(...messages: readonly (readonly number[])[]): string {
	return messages.map(prettyBytes).join(' ')
}

type Representable =
	| undefined
	| null
	| boolean
	| number
	| string
	| readonly Representable[]
	| { readonly [key: string]: Representable }

/** Generate a debug representation of `val`. */
export function repr(val: Representable): string {
	if (val === undefined) {
		return 'undefined'
	}
	return JSON.stringify(val)
}
