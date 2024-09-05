import { TCPHelper } from '@companion-module/base'
import net from 'net'
import { type Interaction } from './interactions.js'
import { type MidiMessage, type MidiMessageEvents, MidiTokenizer } from '../tokenize.js'
import { prettyByte, prettyBytes, repr } from '../../../utils/pretty.js'
import { promiseWithResolvers } from '../../../utils/promise-with-resolvers.js'

/** Turn on extra logging in performing test interactions to debug tests. */
const DEBUG_LOGGING = true

/** Log the given message if interaction-test debugging is enabled. */
function LOG(msg: string): void {
	if (DEBUG_LOGGING) {
		console.log(msg)
	}
}

/**
 * Using a server running on the given port, check expected MIDI tokenizing of
 * the list of data packets.
 *
 * @param server
 *   A server that performs the functions of a mock camera.
 * @param port
 *   The TCP port the camera mocked by `server` is running on.
 * @param packets
 *   The MIDI bytes to tokenize.
 * @param expectedMessages
 *    The expected messages produced by tokenizing `packets`.
 */
async function checkTokenizing(server: net.Server, port: number, interactions: readonly Interaction[]): Promise<void> {
	const socketPromise = new Promise<net.Socket>((resolve: (socket: net.Socket) => void) => {
		server.once('connection', (socket: net.Socket) => {
			resolve(socket)
		})
	})

	const tcpReady = new Promise<TCPHelper>((resolve: (tcp: TCPHelper) => void) => {
		const tcp = new TCPHelper('127.0.0.1', port)

		tcp.once('connect', () => {
			resolve(tcp)
		})
	})

	const [sink, source] = await Promise.all([socketPromise, tcpReady])
	let sinkClosed = false

	const verboseLog = (msg: string) => {
		console.log(msg)
	}

	const tokenizer = new MidiTokenizer(source, verboseLog)

	const { promise, resolve } = promiseWithResolvers<MidiMessage>()

	const waiting = [{ promise, resolve, resolved: false }]
	let firstUnresolved = 0

	async function getNextMessage(): Promise<MidiMessage> {
		return waiting[0].promise.then((message: MidiMessage) => {
			waiting.shift()
			firstUnresolved--
			return message
		})
	}

	function addHandler<M extends MidiMessage>(
		messageType: keyof MidiMessageEvents,
		handler: (message: M['message']) => M,
	): void {
		tokenizer.on(messageType, (message: M['message']) => {
			console.log(`Received message ${typeof message === 'number' ? prettyByte(message) : prettyBytes(message)}`)
			const waiter = waiting[firstUnresolved++]
			waiter.resolve(handler(message))
			waiter.resolved = true

			const { promise, resolve } = promiseWithResolvers<MidiMessage>()
			waiting.push({ promise, resolve, resolved: false })
		})
	}

	function assertNextMessageNotReady(): void {
		console.log(`Expecting next message to not be ready...`)
		if (waiting[0].resolved) {
			throw new Error('Expected next message to not be ready, but was')
		}
	}

	addHandler('channel_message', (message: number[]) => ({ type: 'channel', message }))
	addHandler('system_common', (message: number[]) => ({ type: 'system-common', message }))
	addHandler('system_exclusive', (message: number[]) => ({ type: 'system-exclusive', message }))
	addHandler('system_realtime', (message: number) => ({ type: 'system-real-time', message }))

	let tokenizingComplete = false
	const runTokenizer = tokenizer.run().finally(() => {
		tokenizingComplete = true
	})

	function compareMessage(
		actualMessage: MidiMessage,
		expectedType: MidiMessage['type'],
		expectedMessage: readonly number[],
	): void {
		if (actualMessage.type === 'system-real-time') {
			throw new Error(
				`Expected ${expectedType} ${prettyBytes(expectedMessage)} message, got real time ${prettyByte(actualMessage.message)}`,
			)
		}

		if (actualMessage.type !== expectedType) {
			throw new Error(
				`Expected ${expectedType} message ${prettyBytes(expectedMessage)}, got ${prettyBytes(actualMessage.message)}`,
			)
		}

		if (
			expectedMessage.length !== actualMessage.message.length ||
			!expectedMessage.every((b, i) => b === actualMessage.message[i])
		) {
			throw new Error(`Expected message ${prettyBytes(expectedMessage)} but got ${prettyBytes(actualMessage.message)}`)
		}
	}

	try {
		for (const interaction of interactions) {
			const { type } = interaction
			LOG(`Running interaction ${type}`)
			switch (type) {
				case 'mixer-reply': {
					await new Promise<void>((resolve: () => void, reject: (err: Error) => void) => {
						const { bytes } = interaction
						sink.write(bytes, (err?: Error) => {
							LOG(`Wrote ${prettyBytes(Array.from(bytes))}${err !== undefined ? err : ''}`)
							if (err !== undefined) {
								reject(err)
							} else {
								resolve()
							}
						})
					})
					break
				}

				case 'next-message-not-ready': {
					assertNextMessageNotReady()
					break
				}

				case 'expect-system-real-time': {
					const actualMessage = await getNextMessage()
					if (actualMessage.type !== 'system-real-time') {
						throw new Error(
							`Expected system real time message ${prettyByte(interaction.message)}, got ${repr(actualMessage)}`,
						)
					}
					break
				}

				case 'expect-channel-message':
					compareMessage(await getNextMessage(), 'channel', interaction.message)
					break

				case 'expect-system-common':
					compareMessage(await getNextMessage(), 'system-common', interaction.message)
					break

				case 'expect-system-exclusive':
					compareMessage(await getNextMessage(), 'system-exclusive', interaction.message)
					break

				case 'mixer-close-socket': {
					await new Promise<void>((resolve: () => void) => {
						sink.end(() => {
							sinkClosed = true
							resolve()
						})
					})
					break
				}
			}
		}

		if (!sinkClosed && tokenizingComplete) {
			throw new Error('Tokenizing should continue while the socket is open')
		}
	} catch (e) {
		if (e instanceof Error) {
			throw e
		} else {
			throw new Error(`Parse testing threw error: ${e}`)
		}
	} finally {
		await new Promise<void>((resolve: () => void) => {
			let closeCount = 0
			const maybeClose = () => {
				closeCount++
				if (closeCount === 2) {
					resolve()
				}
			}

			sink.end(maybeClose)
			server.close(maybeClose)
		})

		source.destroy()
	}

	if (!tokenizingComplete) {
		throw new Error('MIDI tokenizing should be complete by here')
	}

	return runTokenizer.then(() => {
		if (waiting.length > 1) {
			throw new Error('Failed to consume all tokenized messages')
		}
	})
}

/**
 * Tokenize the given series of packets as MIDI data, and compare the resulting
 * series of MIDI messages against `expectedMessages`.
 *
 * Note that only channel messages are currently tokenized: system messages are
 * simply discarded.
 *
 * @param packets
 * 	  An array of arrays of bytes to parse.
 * @param expectedMessages
 *    The messages expected to result from parsing `packets`.
 */
export async function TestMidiTokenizing(interactions: readonly Interaction[]): Promise<void> {
	LOG(`Test start`)

	type ServerInfo = {
		server: net.Server
		port: number
	}

	// MIDI parsing currently requires reading from a TCPHelper.  There may be
	// an easier way to conjure up one that'll be fed `packets` than to spin up
	// a full-fledged TCP server to connect to.  But this is test helper code
	// (not even test code that needs to be reasonably skimmable by future
	// developers).  If it gets the job done, some ugliness is tolerable.
	const { server, port } = await new Promise<ServerInfo>(
		(resolve: ({ server, port }: ServerInfo) => void, reject: (err: Error) => void) => {
			const server = net.createServer({ noDelay: true })

			server.on('error', (err: Error) => {
				LOG(`Server had an error: ${err}`)
				reject(err)
			})

			const randomlyChosenPort = 0
			server.listen(randomlyChosenPort, () => {
				const addr = server.address()
				if (typeof addr === 'string' || addr === null) {
					reject(new Error('server not running on an IP socket?'))
					return
				}

				resolve({ server, port: addr.port })
			})
		},
	)

	return checkTokenizing(server, port, interactions)
}
