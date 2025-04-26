// @ts-check

import { generateEslintConfig } from '@companion-module/tools/eslint/config.mjs'

const baseConfig = await generateEslintConfig({
	enableJest: true,
	enableTypescript: true,
})

/**
 * @param {import('eslint').Linter.Config<import('eslint').Linter.RulesRecord>['files']} files
 * @param {readonly string[]} allowModules
 * @returns {import('eslint').Linter.Config<import('eslint').Linter.RulesRecord>}
 */
function permitLimitedUnpublishedImports(files, allowModules) {
	return { files, rules: { 'n/no-unpublished-import': ['error', { allowModules }] } }
}

const testFilePatterns = ['src/**/*spec.ts', 'src/**/*test.ts']
const testHelperPatterns = ['src/**/__tests__/*', 'src/**/__mocks__/*']

const allTestFilePatterns = [...testFilePatterns, ...testHelperPatterns]

/** @type {import('eslint').Linter.Config<import('eslint').Linter.RulesRecord>[]} */
const customConfig = [
	...baseConfig,

	{
		ignores: ['eslint.config.*'],
		rules: {
			'object-shorthand': 'error',
			'no-useless-rename': 'error',
			'n/no-missing-import': 'off',
			'n/no-unpublished-import': 'error',
			'@typescript-eslint/strict-boolean-expressions': 'error',
			eqeqeq: 'error',
			radix: 'error',
			'no-eval': 'error',
			'no-implied-eval': 'error',
			'@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
		},
	},

	{
		files: allTestFilePatterns,
		rules: {
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					vars: 'all',
					argsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
					// In addition to `_*' variables, allow `test_*` variables
					// -- specifically type variables, but this rule doesn't
					// support that further restriction now -- for use in tests
					// of types that are performed using 'type-testing' helpers.
					varsIgnorePattern: '^(?:test)?_',
				},
			],
		},
	},

	permitLimitedUnpublishedImports(allTestFilePatterns, ['type-testing', 'vitest']),
	permitLimitedUnpublishedImports(['eslint.config.mjs'], ['@companion-module/tools']),
	permitLimitedUnpublishedImports(['knip.config.ts'], ['knip']),
	permitLimitedUnpublishedImports(['vitest.config.ts'], ['vitest']),
]

export default customConfig
