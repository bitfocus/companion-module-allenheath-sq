/** Busy-wait until `ml` milliseconds have passed. */
export function sleep(ml: number): void {
	const dt = Date.now()
	let cd = null
	do {
		cd = Date.now()
	} while (cd - dt < ml)
}

/** Return a promise that resolves after `ms` milliseconds have passed. */
export async function asyncSleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}
