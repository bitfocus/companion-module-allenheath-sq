import type { CompanionOptionValues } from '@companion-module/base'
import { describe, expect, test } from 'vitest'
import { resolveActionOptions } from './resolve-options.js'

describe('resolveActionOptions', () => {
	test('parses string options and leaves non-strings unchanged', async () => {
		const options: CompanionOptionValues = {
			fade: '$(internal:fade_seconds)',
			leveldb: 0,
			mute: true,
			target: 'lr',
		}

		const instance = {
			parseVariablesInString: async (value: string): Promise<string> => {
				if (value === '$(internal:fade_seconds)') {
					return '2'
				}
				return value
			},
		} as const

		await expect(resolveActionOptions(instance as never, options)).resolves.toEqual({
			fade: '2',
			leveldb: 0,
			mute: true,
			target: 'lr',
		})
	})

	test('parses string values in arrays', async () => {
		const options: CompanionOptionValues = {
			mixAssign: [0, '$(internal:sink)', 'lr'],
		}

		const instance = {
			parseVariablesInString: async (value: string): Promise<string> => {
				if (value === '$(internal:sink)') {
					return '3'
				}
				return value
			},
		} as const

		await expect(resolveActionOptions(instance as never, options)).resolves.toEqual({
			mixAssign: [0, '3', 'lr'],
		})
	})

	test('applies scalar variable override when enabled', async () => {
		const options: CompanionOptionValues = {
			scene: 1,
			scene__useVar: true,
			scene_var: '$(internal:target_scene)',
		}

		const instance = {
			parseVariablesInString: async (value: string): Promise<string> => {
				if (value === '$(internal:target_scene)') {
					return '4'
				}
				return value
			},
		} as const

		await expect(resolveActionOptions(instance as never, options)).resolves.toEqual({
			scene: '4',
			scene__useVar: true,
			scene_var: '4',
		})
	})

	test('applies array variable override when enabled', async () => {
		const options: CompanionOptionValues = {
			mixAssign: [0],
			mixAssign__useVar: true,
			mixAssign_var: '1, lr, 3',
		}

		const instance = {
			parseVariablesInString: async (value: string): Promise<string> => value,
		} as const

		await expect(resolveActionOptions(instance as never, options)).resolves.toEqual({
			mixAssign: [1, 'lr', 3],
			mixAssign__useVar: true,
			mixAssign_var: '1, lr, 3',
		})
	})
})
