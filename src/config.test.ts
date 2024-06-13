import { describe, expect, test } from '@jest/globals'
import { addModelOptionToConfig, configIsMissingModel, type SQInstanceConfig } from './config.js'

describe('config upgrade to specify a missing model', () => {
	test('config without model', () => {
		const configMissingModel = {
			host: '127.0.0.1',
			level: 'LinearTaper',
			talkback: 0,
			midich: 0,
			status: 'full',
			verbose: false,
		} as SQInstanceConfig

		expect(configIsMissingModel(configMissingModel)).toBe(true)

		addModelOptionToConfig(configMissingModel)

		expect(configIsMissingModel(configMissingModel)).toBe(false)
		expect(configMissingModel.model).toBe('SQ5')
	})

	test("config with model='SQ5'", () => {
		const configWithModelSQ5: SQInstanceConfig = {
			host: '127.0.0.1',
			model: 'SQ5',
			level: 'LinearTaper',
			talkback: 0,
			midich: 0,
			status: 'full',
			verbose: false,
		}

		expect(configIsMissingModel(configWithModelSQ5)).toBe(false)
		expect(configWithModelSQ5.model).toBe('SQ5')
	})

	test("config with model='SQ7'", () => {
		const configWithModelSQ5: SQInstanceConfig = {
			host: '127.0.0.1',
			model: 'SQ7',
			level: 'LinearTaper',
			talkback: 0,
			midich: 0,
			status: 'full',
			verbose: false,
		}

		expect(configIsMissingModel(configWithModelSQ5)).toBe(false)
		expect(configWithModelSQ5.model).toBe('SQ7')
	})
})
