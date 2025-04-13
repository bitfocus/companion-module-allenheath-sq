import EventEmitter from 'eventemitter3'
import { ChannelParser, type MixerMessageEvents } from '../channel-parser.js'
import type { ExpectInteraction, Interaction, ReceiveInteraction } from './interactions.js'
import type { MuteParam } from '../../../mixer/nrpn/mute.js'
import { parseMidi } from '../parse-midi.js'
import { type MidiMessage, type MidiMessageEvents, type Tokenizer } from '../../tokenize/tokenizer.js'
import { promiseWithResolvers } from '../../../utils/promise-with-resolvers.js'
import { prettyBytes, repr } from '../../../utils/pretty.js'

class MixerCommandBase {
	args: number[]

	constructor(...args: number[]) {
		this.args = args
	}
}

class SceneReceived extends MixerCommandBase {
	readonly type = 'scene-received'
}

class MuteReceived extends MixerCommandBase {
	readonly type = 'mute-received'

	constructor({ MSB, LSB }: MuteParam, vf: number) {
		super(MSB, LSB, vf)
	}
}

class FaderLevelReceived extends MixerCommandBase {
	readonly type = 'fader-level-received'
}

class PanLevelReceived extends MixerCommandBase {
	readonly type = 'pan-level-received'
}

type MixerCommand = SceneReceived | MuteReceived | FaderLevelReceived | PanLevelReceived

/** A mock MIDI tokenizer that emits messages for MIDI events. */
class MockTokenizer extends EventEmitter<MidiMessageEvents> implements Tokenizer {
	#runPromise: Promise<void>
	#resolveRun: () => void
	#finished = false

	constructor() {
		super()

		const { promise, resolve } = promiseWithResolvers<void>()
		this.#runPromise = promise
		this.#resolveRun = resolve
	}

	/** Emit the given MIDI message. */
	emitMessage<M extends MidiMessage>(m: M): void {
		const { type, message } = m
		if (this.#finished) {
			throw new TypeError(
				`unexpected attempt to emit ${type} message ${
					typeof message === 'number' ? String(message) : prettyBytes(message)
				} after tokenizer finish`,
			)
		}

		switch (type) {
			case 'channel':
				this.emit('channel_message', message.slice())
				break
			case 'system-common':
				this.emit('system_common', message.slice())
				break
			case 'system-exclusive':
				this.emit('system_exclusive', message.slice())
				break
			case 'system-real-time':
				this.emit('system_realtime', message)
				break
		}
	}

	/** Stop this tokenizer. */
	finish(): void {
		this.#finished = true
		this.#resolveRun()
	}

	/**
	 * Run the tokenizer.  The returned promise settles once all tokenizing is
	 * complete (i.e. `finish` was called).
	 */
	async run(): Promise<void> {
		return this.#runPromise
	}
}

type Waiter = {
	readonly promise: Promise<MixerCommand>
	readonly resolve: (value: MixerCommand) => void
	resolved: boolean
}

/** Serialize emitted mixer command events from a mixer channel parser. */
class MixerCommandIter {
	#gen: AsyncGenerator<MixerCommand, void, unknown>
	#waiting: Waiter[] = [MixerCommandIter.#waiter()]
	#firstUnresolved = 0

	private constructor() {
		this.#gen = MixerCommandIter.#readCommands(this)
	}

	static #waiter(): Waiter {
		const { promise, resolve } = promiseWithResolvers<MixerCommand>()
		return { promise, resolve, resolved: false }
	}

	static async create(mixerChannelParser: ChannelParser): Promise<MixerCommandIter> {
		const mci = new MixerCommandIter()

		const addHandler = <T extends keyof MixerMessageEvents>(
			type: T,
			handler: new (...args: MixerMessageEvents[T]) => MixerCommand,
		): void => {
			mixerChannelParser.on(type, (...args: MixerMessageEvents[T]) => {
				const waiter = mci.#waiting[mci.#firstUnresolved++]
				waiter.resolve(new handler(...args))
				waiter.resolved = true

				mci.#waiting.push(MixerCommandIter.#waiter())
			})
		}

		addHandler('scene', SceneReceived)
		addHandler('mute', MuteReceived)
		addHandler('fader_level', FaderLevelReceived)
		addHandler('pan_level', PanLevelReceived)

		return mci
	}

	/** Return the next mixer command iterator result. */
	async nextCommand(): Promise<IteratorResult<MixerCommand>> {
		return this.#gen.next()
	}

	/**
	 * Assert that the next mixer command is ready/not ready to be processed.
	 */
	assertNextCommandReadiness(ready: boolean): void {
		console.log(`Expecting next message to be ${ready ? '' : 'not '}ready...`)
		if (this.#waiting[0].resolved !== ready) {
			throw new Error(`Expected next message to be ${ready ? '' : 'not '}ready, but was${ready ? "n't" : ''}`)
		}
	}

	hasPendingCommand(): boolean {
		return this.#waiting.length > 1
	}

	static async *#readCommands(mixerCommandIter: MixerCommandIter): AsyncGenerator<MixerCommand, void, unknown> {
		for (;;) {
			const p = mixerCommandIter.#waiting[0].promise.finally(() => {
				mixerCommandIter.#waiting.shift()
				mixerCommandIter.#firstUnresolved--
			})
			yield p
		}
	}
}

/**
 * Run the provided series of interactions to verify parsing of MIDI messages
 * sent by a mixer.
 *
 * @param channel
 *   The MIDI channel in which mixer commands are processed.  (Messages in other
 *   MIDI channels are currently ignored.)
 * @param interactions
 *   The series of interactions to perform to test MIDI parsing.
 */
export async function TestParsing(channel: number, interactions: readonly Interaction[]): Promise<void> {
	const verboseLog = (msg: string): void => {
		console.log(msg)
	}

	const tokenizer = new MockTokenizer()

	const midiChannelParser = new ChannelParser(verboseLog)

	const commandIter = await MixerCommandIter.create(midiChannelParser)

	const runParser = parseMidi(channel, verboseLog, tokenizer, midiChannelParser)

	async function expectEvent(type: MixerCommand['type'], interaction: ExpectInteraction): Promise<void> {
		console.log(`Performing ${interaction.type} for ${interaction.args}`)
		const result = await commandIter.nextCommand()
		const noNextCommand = Boolean(result.done)
		if (noNextCommand) {
			throw new Error(`Expected ${type} but ran out of commands`)
		}

		const command = result.value
		if (command.type !== type) {
			throw new Error(`Expected ${type}, got ${command.type} ${JSON.stringify(command)}`)
		}

		if (interaction.args.length !== command.args.length || !interaction.args.every((v, i) => v === command.args[i])) {
			throw new Error(`Args mismatch: expected ${repr(interaction.args)}, got ${repr(command.args)}`)
		}
	}

	function logReceive(interaction: ReceiveInteraction): void {
		const message = interaction.message
		console.log(
			`Performing ${interaction.type} ${typeof message === 'number' ? String(message) : prettyBytes(message)}`,
		)
	}

	try {
		console.log('Running interactions...')
		for (const interaction of interactions) {
			const { type } = interaction
			switch (type) {
				case 'receive-channel-message': {
					logReceive(interaction)
					tokenizer.emitMessage({
						type: 'channel',
						message: interaction.message.slice(),
					})
					break
				}

				case 'receive-system-common-message': {
					logReceive(interaction)
					tokenizer.emitMessage({
						type: 'system-common',
						message: interaction.message.slice(),
					})
					break
				}

				case 'receive-system-exclusive-message': {
					logReceive(interaction)
					tokenizer.emitMessage({
						type: 'system-exclusive',
						message: interaction.message.slice(),
					})
					break
				}

				case 'receive-system-real-time': {
					logReceive(interaction)
					tokenizer.emitMessage({
						type: 'system-real-time',
						message: interaction.message,
					})
					break
				}

				case 'command-readiness': {
					commandIter.assertNextCommandReadiness(interaction.ready)
					break
				}

				case 'expect-scene':
					await expectEvent('scene-received', interaction)
					break

				case 'expect-mute':
					await expectEvent('mute-received', interaction)
					break

				case 'expect-fader-level':
					await expectEvent('fader-level-received', interaction)
					break

				case 'expect-pan-level':
					await expectEvent('pan-level-received', interaction)
					break
			}
		}
	} finally {
		tokenizer.finish()
	}

	return runParser.then(() => {
		if (commandIter.hasPendingCommand()) {
			throw new Error('Should have expected all sent commands')
		}
	})
}
