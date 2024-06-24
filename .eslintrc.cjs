module.exports = {
	extends: './node_modules/@companion-module/tools/eslint/main.cjs',
	rules: {
		'n/no-unpublished-import': [
			'error',
			{
				allowModules: ['@jest/globals'],
			},
		],
		'@typescript-eslint/consistent-type-imports': [
			'error',
			{
				fixStyle: 'inline-type-imports',
			},
		],
	},
	overrides: [],
}
