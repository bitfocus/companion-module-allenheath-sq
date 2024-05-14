/** Return an unresolved promise and resolve/reject functions for it. */
export function promiseWithResolvers<T>(): {
	promise: Promise<T>
	resolve: (value: T) => void
	reject: (reason?: any) => void
} {
	let promiseResolve: (value: T) => void
	let promiseReject: (reason?: any) => void
	const promise = new Promise<T>((resolve: (value: T) => void, reject: (reason?: any) => void) => {
		promiseResolve = resolve
		promiseReject = reject
	})

	return {
		promise,
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		resolve: promiseResolve!,
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		reject: promiseReject!,
	}
}
