// @ts-check

import { generateEslintConfig } from '@companion-module/tools/eslint/config.mjs'

const baseConfig = await generateEslintConfig({
	enableJest: true,
	enableTypescript: true,
})

const permittedUnpublishedImports = [
	// The type-testing types are erased during compilation, so it's fine to use
	// it as an unpublished import.
	'type-testing',
]

/**
 * @param {import('eslint').Linter.Config<import('eslint').Linter.RulesRecord>['files']} files
 * @param {readonly string[]} allowModules
 * @returns {import('eslint').Linter.Config<import('eslint').Linter.RulesRecord>}
 */
function permitLimitedUnpublishedImports(files, allowModules) {
	return {
		files,
		rules: {
			'n/no-unpublished-import': [
				'error',
				{
					allowModules: [...new Set(permittedUnpublishedImports.concat(allowModules))],
				},
			],
		},
	}
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
			'n/no-unpublished-import': [
				'error',
				{
					allowModules: permittedUnpublishedImports,
				},
			],
			'@typescript-eslint/strict-boolean-expressions': 'error',
			eqeqeq: 'error',
			radix: 'error',
			'no-eval': 'error',
			'no-implied-eval': 'error',
			'@typescript-eslint/consistent-type-imports': [
				'error',
				{
					fixStyle: 'inline-type-imports',
				},
			],

			// Turn off the general unused-vars rule, and turn on a more refined
			// TypeScript-specific rule.
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					vars: 'all',
					argsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
					// In addition to `_*' variables, allow `assert_*` variables
					// -- specifically type variables, but this rule doesn't
					// support that further restriction now -- for verifying
					// type characteristics using 'type-testing' helpers.  As
					// these will be erased during compilation, allow them in
					// source files as well as in test files.
					varsIgnorePattern: '^(?:assert)?_',
				},
			],
		},
	},

	permitLimitedUnpublishedImports(allTestFilePatterns, ['vitest']),
	permitLimitedUnpublishedImports(['eslint.config.mjs'], ['@companion-module/tools']),
	permitLimitedUnpublishedImports(['knip.config.ts'], ['knip']),
	permitLimitedUnpublishedImports(['vitest.config.ts'], ['vitest']),
]

export default customConfig
