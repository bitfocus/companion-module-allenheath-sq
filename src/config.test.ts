import { describe, expect, test } from 'vitest'
import {
	type RawConfig,
	tryEnsureLabelInConfig,
	tryEnsureModelOptionInConfig,
	tryRemoveUnnecessaryLabelInConfig,
} from './config.js'

describe('config upgrade to specify a missing model', () => {
	test('config without model', () => {
		const configMissingModel: RawConfig = {
			host: '127.0.0.1',
			level: 'LinearTaper',
			talkback: 0,
			midich: 0,
			status: 'full',
			label: 'SQ',
			verbose: false,
		}

		expect('model' in configMissingModel).toBe(false)

		expect(tryEnsureModelOptionInConfig(configMissingModel)).toBe(true)

		expect('model' in configMissingModel).toBe(true)
		expect(configMissingModel.model).toBe('SQ5')
	})

	test("config with model='SQ5'", () => {
		const configWithModelSQ5: RawConfig = {
			host: '127.0.0.1',
			model: 'SQ5',
			level: 'LinearTaper',
			talkback: 0,
			midich: 0,
			status: 'full',
			label: 'SQ',
			verbose: false,
		}

		expect('model' in configWithModelSQ5).toBe(true)
		expect(configWithModelSQ5.model).toBe('SQ5')

		expect(tryEnsureModelOptionInConfig(configWithModelSQ5)).toBe(false)

		expect('model' in configWithModelSQ5).toBe(true)
		expect(configWithModelSQ5.model).toBe('SQ5')
	})

	test("config with model='SQ7'", () => {
		const configWithModelSQ7: RawConfig = {
			host: '127.0.0.1',
			model: 'SQ7',
			level: 'LinearTaper',
			talkback: 0,
			midich: 0,
			status: 'full',
			label: 'SQ',
			verbose: false,
		}

		expect('model' in configWithModelSQ7).toBe(true)
		expect(configWithModelSQ7.model).toBe('SQ7')

		expect(tryEnsureModelOptionInConfig(configWithModelSQ7)).toBe(false)

		expect('model' in configWithModelSQ7).toBe(true)
		expect(configWithModelSQ7.model).toBe('SQ7')
	})
})

describe('config upgrade to specify a missing label', () => {
	test('config without label', () => {
		const configMissingLabel: RawConfig = {
			host: '127.0.0.1',
			model: 'SQ5',
			level: 'LinearTaper',
			talkback: 0,
			midich: 0,
			status: 'full',
			verbose: false,
		}

		expect('label' in configMissingLabel).toBe(false)

		expect(tryEnsureLabelInConfig(configMissingLabel)).toBe(true)

		expect('label' in configMissingLabel).toBe(true)
		expect(configMissingLabel.label).toBe('SQ')
	})

	test("config with label='sq5'", () => {
		const configWithLabelSQ5: RawConfig = {
			host: '127.0.0.1',
			model: 'SQ5',
			level: 'LinearTaper',
			talkback: 0,
			midich: 0,
			status: 'full',
			label: 'sq5',
			verbose: false,
		}

		expect('label' in configWithLabelSQ5).toBe(true)
		expect(configWithLabelSQ5.label).toBe('sq5')

		expect(tryEnsureLabelInConfig(configWithLabelSQ5)).toBe(false)

		expect('label' in configWithLabelSQ5).toBe(true)
		expect(configWithLabelSQ5.label).toBe('sq5')
	})
})

describe('config upgrade to remove an unnecessary label', () => {
	test('config without label', () => {
		const configMissingLabel: RawConfig = {
			host: '127.0.0.1',
			model: 'SQ5',
			level: 'LinearTaper',
			talkback: 0,
			midich: 0,
			status: 'full',
			verbose: false,
		}

		expect('label' in configMissingLabel).toBe(false)

		expect(tryRemoveUnnecessaryLabelInConfig(configMissingLabel)).toBe(false)

		expect('label' in configMissingLabel).toBe(false)
	})

	test('config with label', () => {
		const configWithLabel: RawConfig = {
			host: '127.0.0.1',
			model: 'SQ5',
			level: 'LinearTaper',
			talkback: 0,
			midich: 0,
			status: 'full',
			verbose: false,
			label: 'SQ',
		}

		expect('label' in configWithLabel).toBe(true)

		expect(tryRemoveUnnecessaryLabelInConfig(configWithLabel)).toBe(true)

		expect('label' in configWithLabel).toBe(false)
	})
})
