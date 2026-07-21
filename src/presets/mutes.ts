import type { CompanionPresetDefinitions } from '@companion-module/base'
import { MuteActionId } from '../actions/mute.js'
import { MuteFeedbackId } from '../feedbacks/mute.js'
import type { Model } from '../mixer/model.js'
import { White, Black } from '../utils/colors.js'

// Doesn't this lint make *no sense* for intersections?  The intersection of two
// types that *do not* duplicate is just `never`, which makes any such
// intersection's result totally vacuous...right?
// eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
type MuteType = keyof typeof MuteFeedbackId & keyof typeof MuteActionId

export function mutePresets(model: Model): CompanionPresetDefinitions {
	const presets: CompanionPresetDefinitions = {}

	/* MUTE */
	const createtMute = (category: string, label: string, type: MuteType, count: number): void => {
		for (let i = 0; i < count; i++) {
			const suffix = count > 1 ? `_${i}` : ''
			const maybeSpaceNum = count > 1 ? ` ${i + 1}` : ''
			presets[`preset_${MuteActionId[type]}${suffix}`] = {
				type: 'button',
				category,
				name: `${label}${maybeSpaceNum}`,
				style: {
					text: `${label}${maybeSpaceNum}`,
					size: 'auto',
					color: White,
					bgcolor: Black,
				},
				steps: [
					{
						down: [
							{
								actionId: MuteActionId[type],
								options: {
									strip: i,
									mute: 0,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: MuteFeedbackId[type],
						options: {
							channel: i,
						},
					},
				],
			}
		}
	}

	createtMute('Mute Input', 'Input channel', 'MuteInputChannel', model.inputOutputCounts.inputChannel)
	createtMute('Mute Mix - Group', 'LR', 'MuteLR', model.inputOutputCounts.lr)
	createtMute('Mute Mix - Group', 'Aux', 'MuteMix', model.inputOutputCounts.mix)
	createtMute('Mute Mix - Group', 'Group', 'MuteGroup', model.inputOutputCounts.group)
	createtMute('Mute Mix - Group', 'Matrix', 'MuteMatrix', model.inputOutputCounts.matrix)
	createtMute('Mute FX', 'FX Send', 'MuteFXSend', model.inputOutputCounts.fxSend)
	createtMute('Mute FX', 'FX Return', 'MuteFXReturn', model.inputOutputCounts.fxReturn)
	createtMute('Mute DCA', 'DCA', 'MuteDCA', model.inputOutputCounts.dca)
	createtMute('Mute MuteGroup', 'MuteGroup', 'MuteMuteGroup', model.inputOutputCounts.muteGroup)

	return presets
}
