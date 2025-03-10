// Don't enable @ts-check yet because `generateEslintConfig` doesn't ship with
// TypeScript declaration support.

import { generateEslintConfig } from '@companion-module/tools/eslint/config.mjs'

const baseConfig = await generateEslintConfig({
	enableJest: true,
	enableTypescript: true,
	ignores: [
		// Legacy JS files are being refactored out of existence, so skip them.
		'src/api.js',
		'src/instance.js',
	],
})

/**
 * @param {import('eslint').Linter.Config<import('eslint').Linter.RulesRecord>['files']} files
 * @param {readonly string[]} allowModules
 * @returns {import('eslint').Linter.Config<import('eslint').Linter.RulesRecord>}
 */
function permitLimitedUnpublishedImports(files, allowModules) {
	return { files, rules: { 'n/no-unpublished-import': ['error', { allowModules }] } }
}

const customConfig = [
	...baseConfig,

	{
		ignores: ['eslint.config.*'],
		rules: {
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

	permitLimitedUnpublishedImports(
		['src/**/*spec.ts', 'src/**/*test.ts', 'src/**/__tests__/*', 'src/**/__mocks__/*'],
		['@jest/globals'],
	),
	permitLimitedUnpublishedImports(['eslint.config.mjs'], ['@companion-module/tools']),
	permitLimitedUnpublishedImports(['jest.config.ts'], ['ts-jest']),
	permitLimitedUnpublishedImports(['knip.config.ts'], ['knip']),
]

export default customConfig
