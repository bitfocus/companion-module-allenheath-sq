import type {
	CompanionInputFieldDropdown,
	CompanionInputFieldTextInput,
	CompanionOptionValues,
	DropdownChoice,
} from '@companion-module/base'
import type { sqInstance } from '../instance.js'
import { type NRPN, splitNRPN } from '../mixer/nrpn/nrpn.js'
import { PanBalanceLevelOptionId, ShowVarOptionId } from './schemas/panning.js'
import type { PanBalance } from '../types.js'
import { repr } from '../utils/pretty.js'

type PanBalanceOperation =
	| {
			type: 'step-right'
	  }
	| {
			type: 'step-left'
	  }
	| {
			type: 'absolute'
			position: PanBalance
	  }

/**
 * A dropdown option of the set of pan/balance level options for pan/balance
 * actions.
 */
export const PanLevelOption = {
	type: 'dropdown',
	label: 'Level',
	id: PanBalanceLevelOptionId,
	default: 'CTR',
	choices: ((): DropdownChoice[] => {
		const panLevels: DropdownChoice[] = [
			{ label: `Step Right`, id: 998 },
			{ label: `Step Left`, id: 999 },
		]
		for (let i = -100; i <= 100; i += 5) {
			const pos = i < 0 ? `L${Math.abs(i)}` : i === 0 ? `CTR` : `R${i}`
			panLevels.push({ label: `${pos}`, id: `${pos}` })
		}

		return panLevels
	})(),
	minChoicesForSearch: 0,
} as const satisfies CompanionInputFieldDropdown

/**
 * Compute the pan/balance operation defined in the given options.
 *
 * @param instance
 *   The instance for which an action is being processed.
 * @param options
 *   The options supplied to the action.
 * @returns
 *   The pan/balance operation to perform.
 */
export function getPanBalanceOperation(
	instance: sqInstance,
	options: CompanionOptionValues,
): PanBalanceOperation | null {
	const rawOptionVal = options[PanBalanceLevelOptionId]
	if (rawOptionVal === 998) {
		return { type: 'step-right' }
	}
	if (rawOptionVal === 999) {
		return { type: 'step-left' }
	}

	const optionVal = String(rawOptionVal)
	if (optionVal === 'CTR') {
		return { type: 'absolute', position: 'CTR' }
	}

	if (optionVal.length > 0) {
		const first = optionVal[0]
		if (first === 'L' || first === 'R') {
			const n = Number(optionVal.slice(1))
			if (n % 5 === 0 && 5 <= n && n <= 100) {
				return { type: 'absolute', position: `${first}${n}` }
			}
		}
	}

	instance.log('error', `Invalidly specified pan/balance operation, aborting action: ${repr(rawOptionVal)}`)
	return null
}

export const ShowVarOption = {
	type: 'textinput',
	label: 'Instance variable containing pan/balance level (click Learn to refresh)',
	id: ShowVarOptionId,
	default: '',
} as const satisfies CompanionInputFieldTextInput

/**
 * Return the desired learned variables to write a pan/balance variable
 * specifier to the `ShowVarOption` output option.
 */
export function learnShowVar<Options extends CompanionOptionValues>(
	instance: sqInstance,
	options: Options,
	nrpn: NRPN<'panBalance'>,
): Options {
	const { MSB, LSB } = splitNRPN(nrpn)

	return {
		...options,
		[ShowVarOptionId]: `$(${instance.label}:pan_${MSB}.${LSB})`,
	}
}
