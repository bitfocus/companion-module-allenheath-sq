import type { CompanionInputFieldDropdown } from '@companion-module/base'
import type { Choices } from '../../choices.js'

export const OutputFaderOptionId = 'input'

export function faderOption(faderChoice: keyof Choices, choices: Choices): CompanionInputFieldDropdown {
	return {
		type: 'dropdown',
		label: 'Fader',
		id: OutputFaderOptionId,
		default: 0,
		choices: choices[faderChoice],
		minChoicesForSearch: 0,
	}
}
