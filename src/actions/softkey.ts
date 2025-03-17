import { type CompanionOptionValues } from '@companion-module/base'
import { type ActionDefinitions } from './actionid.js'
import { type Choices } from '../choices.js'
import type { sqInstance } from '../instance.js'
import { type Mixer } from '../mixer/mixer.js'
import { type Model } from '../mixer/model.js'
import { repr } from '../utils/pretty.js'

/** Action IDs for all actions that operate softkeys. */
export enum SoftKeyId {
	SoftKey = 'key_soft',
}

enum SoftKeyOp {
	Toggle = '0',
	Press = '1',
	Release = '2',
}

type SoftKeyOptions = {
	softKey: number
	op: SoftKeyOp
}

function getSoftKeyOptions(instance: sqInstance, model: Model, options: CompanionOptionValues): SoftKeyOptions | null {
	const softKey = Number(options.softKey)
	if (model.softKeys <= softKey) {
		instance.log('error', `Attempting to operate invalid softkey ${softKey}, ignoring`)
		return null
	}

	const option = String(options.pressedsk)
	let op
	switch (option) {
		case '1':
			op = SoftKeyOp.Press
			break
		case '2':
			op = SoftKeyOp.Release
			break
		case '0':
			op = SoftKeyOp.Toggle
			break
		default:
			instance.log('error', `Bad softkey option value ${repr(option)}, ignoring`)
			return null
	}

	return { softKey, op }
}

/**
 * Generate action definitions for operating mixer softkeys.
 *
 * @param instance
 *   The instance for which actions are being generated.
 * @param mixer
 *   The mixer object to use when executing the actions.
 * @param choices
 *   Option choices for use in the actions.
 * @returns
 *   The set of all softkey action definitions.
 */
export function softKeyActions(instance: sqInstance, mixer: Mixer, choices: Choices): ActionDefinitions<SoftKeyId> {
	const model = mixer.model

	return {
		[SoftKeyId.SoftKey]: {
			name: 'Press Softkey',
			options: [
				{
					type: 'dropdown',
					label: 'Soft Key',
					id: 'softKey',
					default: 0,
					choices: choices.softKeys,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Key type',
					id: 'pressedsk',
					default: SoftKeyOp.Press,
					choices: [
						{ id: SoftKeyOp.Toggle, label: 'Toggle' },
						{ id: SoftKeyOp.Press, label: 'Press' },
						{ id: SoftKeyOp.Release, label: 'Release' },
					],
					minChoicesForSearch: 5,
				},
			],
			callback: async ({ options }) => {
				const opts = getSoftKeyOptions(instance, model, options)
				if (opts === null) {
					return
				}

				const { softKey, op } = opts
				switch (op) {
					case SoftKeyOp.Toggle:
					// XXX This is what the module historically did, but it
					//     isn't actually toggling.  Is there actually a way to
					//     toggle?  It doesn't look like there is...
					// eslint-disable-next-line no-fallthrough
					case SoftKeyOp.Press: {
						mixer.pressSoftKey(softKey)
						break
					}
					case SoftKeyOp.Release: {
						mixer.releaseSoftKey(softKey)
						break
					}
				}
			},
		},
	}
}
