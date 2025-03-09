/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { JestConfigWithTsJest } from 'ts-jest'

const config: JestConfigWithTsJest = {
	// All test files are in src/, so limit Jest to searching for tests there.
	rootDir: 'src',

	// TypeScript files must first be transformed to JS for testing.
	transform: {
		'\\.ts$': 'esbuild-jest',
	},

	// Jest doesn't like importing TypeScript files including the ".js" suffix, so
	// remove it.
	moduleNameMapper: {
		'(.+)\\.js': '$1',
	},

	// Treat all TypeScript files as ECMAScript modules.
	extensionsToTreatAsEsm: ['.ts'],

	// The glob patterns Jest uses to detect test files
	testMatch: ['**/?(*.)+(spec|test).ts'],

	// An array of regexp pattern strings that are matched against all test
	// paths, matched tests are skipped
	testPathIgnorePatterns: ['/node_modules/'],
}

export default config
