import { TCPHelper } from '@companion-module/base'

/** A class to read bytes from a socket and append them to a provided array. */
export class SocketReader {
	readonly #gen: AsyncGenerator<void, void, void>

	/**
	 * Create a `SocketReader` that reads from `source` and appends bytes read
	 * to `out`.
	 *     let source: TCPHelper = someTCPHelper
	 *     const out: number[] = []
	 *     const reader = await SocketReader.create(socket, out)
	 *     for (;;) {
	 *         if (!(await reader.read())) {
	 *             // No more data to read, stop
	 *             break
	 *         }
	 *         // `out` has fresh bytes of data appended to it
	 *     }
	 */
	static async create(source: TCPHelper, out: number[]): Promise<SocketReader> {
		const reader = new SocketReader(source, out)

		// Skip past the implicit initial `yield` in `#createSocketReader and
		// (synchronously) begin waiting for more data to become available.
		await reader.#gen.next()

		return reader
	}

	/**
	 * Read more data from the socket and append it to the array specified at
	 * construction.  Return true if more data may be readable.  Return false if
	 * no more data can be read.
	 */
	async read(): Promise<boolean> {
		return !(await this.#gen.next()).done
	}

	private constructor(source: TCPHelper, data: number[]) {
		this.#gen = SocketReader.#createReader(source, data)
	}

	static async *#createReader(source: TCPHelper, receivedData: number[]): AsyncGenerator<void, void, void> {
		const socketClosed = new Promise<boolean>((resolve: (more: boolean) => void, _reject: (reason: Error) => void) => {
			const stop = () => {
				resolve(false)
			}
			source.once('end', stop)
			source.once('error', stop)
		})

		let dataAvailable = (async function readMore() {
			return new Promise<boolean>((resolve: (more: boolean) => void) => {
				source.once('data', (data: Uint8Array) => {
					for (const b of data) receivedData.push(b)
					resolve(true)
					dataAvailable = readMore()
				})
			})
		})()

		for (;;) {
			const keepGoing = await Promise.race([socketClosed, dataAvailable])
			if (!keepGoing) {
				break
			}

			yield
		}
	}
}
