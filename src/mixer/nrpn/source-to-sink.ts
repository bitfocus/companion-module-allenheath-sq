import type { InputOutputType } from '../model.js'
import type { Param } from './param.js'

type SourceToSinkInfo = {
	/**
	 * Base parameter MSB/LSB values for controlling the assignment status of
	 * some source in some sink.
	 */
	readonly assign?: Param

	/**
	 * Base parameter MSB/LSB values for controlling the level of some source in
	 * some sink.
	 *
	 * For example, input channels, groups, and FX returns can be assigned to FX
	 * sends with levels set, so those relationships would define this property.
	 * Meanwhile input channel levels can't be set in groups, so this property
	 * would be absent for that relationship.
	 */
	readonly level?: Param

	/**
	 * Base parameter MSB/LSB values for controlling the pan/balance of some
	 * source in some sink.
	 *
	 * For example, input channels can be panned left/right in stereo mixes and
	 * in LR so will define this property.  But input channels can't be panned
	 * in groups, so that relationship doesn't define this property.
	 */
	readonly panBalance?: Param
}

type SourceToSinkType = {
	readonly [source in InputOutputType]?: {
		readonly [sink in InputOutputType]?: SourceToSinkInfo
	}
}

/**
 * Base parameter MSB/LSB values corresponding to all mixer source-sink
 * relationships.
 */
export const SourceToSinkParameterBase = {
	inputChannel: {
		group: {
			assign: { MSB: 0x66, LSB: 0x74 },
		},
		fxSend: {
			assign: { MSB: 0x6c, LSB: 0x14 },
			level: { MSB: 0x4c, LSB: 0x14 },
		},
		mix: {
			assign: { MSB: 0x60, LSB: 0x44 },
			level: { MSB: 0x40, LSB: 0x44 },
			panBalance: { MSB: 0x50, LSB: 0x44 },
		},
		lr: {
			assign: { MSB: 0x60, LSB: 0x00 },
			level: { MSB: 0x40, LSB: 0x00 },
			panBalance: { MSB: 0x50, LSB: 0x00 },
		},
	},
	fxReturn: {
		fxSend: {
			assign: { MSB: 0x6e, LSB: 0x04 },
			level: { MSB: 0x4e, LSB: 0x04 },
		},
		mix: {
			assign: { MSB: 0x66, LSB: 0x14 },
			level: { MSB: 0x46, LSB: 0x14 },
			panBalance: { MSB: 0x56, LSB: 0x14 },
		},
		lr: {
			assign: { MSB: 0x60, LSB: 0x3c },
			level: { MSB: 0x40, LSB: 0x3c },
			panBalance: { MSB: 0x50, LSB: 0x3c },
		},
		group: {
			assign: { MSB: 0x6b, LSB: 0x34 },
			level: { MSB: 0x4b, LSB: 0x34 },
			panBalance: { MSB: 0x5b, LSB: 0x34 },
		},
	},
	group: {
		fxSend: {
			assign: { MSB: 0x6d, LSB: 0x54 },
			level: { MSB: 0x4d, LSB: 0x54 },
		},
		mix: {
			assign: { MSB: 0x65, LSB: 0x04 },
			level: { MSB: 0x45, LSB: 0x04 },
			panBalance: { MSB: 0x55, LSB: 0x04 },
		},
		lr: {
			assign: { MSB: 0x60, LSB: 0x30 },
			level: { MSB: 0x40, LSB: 0x30 },
			panBalance: { MSB: 0x50, LSB: 0x30 },
		},
		matrix: {
			assign: { MSB: 0x6e, LSB: 0x4b },
			level: { MSB: 0x4e, LSB: 0x4b },
			panBalance: { MSB: 0x5e, LSB: 0x4b },
		},
	},
	lr: {
		matrix: {
			assign: { MSB: 0x6e, LSB: 0x24 },
			level: { MSB: 0x4e, LSB: 0x24 },
			panBalance: { MSB: 0x5e, LSB: 0x24 },
		},
	},
	mix: {
		matrix: {
			assign: { MSB: 0x6e, LSB: 0x27 },
			level: { MSB: 0x4e, LSB: 0x27 },
			panBalance: { MSB: 0x5e, LSB: 0x27 },
		},
	},
} as const satisfies SourceToSinkType
