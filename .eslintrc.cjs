module.exports = {
	extends: './node_modules/@companion-module/tools/eslint/main.cjs',
	overrides: [
		{
			files: ['*.js'],
			rules: {
				'n/no-missing-import': 'off',
			},
		},
	],
}
