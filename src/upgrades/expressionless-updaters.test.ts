import type {
	CompanionMigrationAction,
	CompanionMigrationFeedback,
	CompanionMigrationOptionValues,
	CompanionOptionValues,
} from '@companion-module/base'
import { describe, expect, test } from 'vitest'
import {
	ExpressionlessActionUpdater,
	ExpressionlessFeedbackUpdater,
	type TryUpdateExpressionlessAction,
	type TryUpdateExpressionlessFeedback,
} from './expressionless-updaters.js'
import type { NewCompanionMigrationAction, NewCompanionMigrationFeedback } from './types.js'

type ExpressionlessMigrationOptionValues = CompanionMigrationOptionValues & {
	[key: string]: { isExpression: false }
}

function encloseEveryOptionValueInObject(options: CompanionOptionValues): boolean {
	for (const prop in options) {
		const propval = options[prop]
		if (propval === undefined) {
			continue
		}
		options[prop] = { value: propval }
	}
	return true
}

function renameOption(options: CompanionOptionValues, old: string, rewritten: string): void {
	const val = options[old]
	delete options[old]
	options[rewritten] = val
}

describe('ExpressionlessActionUpdater', () => {
	type NewExpressionlessMigrationAction = Omit<NewCompanionMigrationAction, 'options'> & {
		options: ExpressionlessMigrationOptionValues
	}

	function actionWithExpressionlessOptions(
		actionId: string,
		options: ExpressionlessMigrationOptionValues,
	): NewExpressionlessMigrationAction {
		return {
			actionId,
			id: 'identifier',
			controlId: '3/5/7',
			options,
		}
	}

	function runExpressionlessUpgradeScript(
		action: NewExpressionlessMigrationAction,
		tryUpdate: TryUpdateExpressionlessAction,
	): CompanionMigrationAction | null {
		const result = ExpressionlessActionUpdater(tryUpdate)(null as any, {
			config: null,
			secrets: undefined,
			actions: [structuredClone(action)],
			feedbacks: [],
		})
		return result.updatedActions[0] ?? null
	}

	test("doesn't apply", () => {
		const action = actionWithExpressionlessOptions('actionId', {
			x: {
				isExpression: false,
				value: 'hi',
			},
		})

		const migrated = runExpressionlessUpgradeScript(action, (action) => {
			if (action.actionId !== 'not-actionId') {
				return false
			}

			encloseEveryOptionValueInObject(action.options)
			return true
		})

		expect(migrated, "action updater that doesn't apply").toBeNull()
	})

	test('does apply', () => {
		const action = actionWithExpressionlessOptions('applicable', {
			x: {
				isExpression: false,
				value: 'hi',
			},
		})

		const migrated = runExpressionlessUpgradeScript(action, (action) => {
			if (action.actionId !== 'applicable') {
				return false
			}

			encloseEveryOptionValueInObject(action.options)
			return true
		})

		expect(migrated, 'action updater that applies').toEqual(
			Object.assign(structuredClone(action), {
				options: {
					x: {
						isExpression: false,
						value: {
							value: 'hi',
						},
					},
				},
			}),
		)
	})

	test('property move', () => {
		const action = actionWithExpressionlessOptions('to-move', {
			old1: {
				isExpression: false,
				value: 'bye',
			},
		})

		const migrated = runExpressionlessUpgradeScript(action, (action) => {
			if (action.actionId !== 'to-move') {
				return false
			}

			renameOption(action.options, 'old1', 'new2')
			return true
		})

		expect(migrated, 'action updater with property move').toEqual(
			Object.assign(structuredClone(action), {
				options: {
					new2: {
						isExpression: false,
						value: 'bye',
					},
				},
			}),
		)
	})

	test('property deletion', () => {
		const action = actionWithExpressionlessOptions('has-deletable-property', {
			toDelete: {
				isExpression: false,
				value: 'neener',
			},
		})

		const migrated = runExpressionlessUpgradeScript(action, (action) => {
			if (action.actionId !== 'has-deletable-property') {
				return false
			}

			delete action.options.toDelete
			return true
		})

		expect(migrated, 'action updater with property deletion').toEqual(
			Object.assign(structuredClone(action), {
				options: {},
			}),
		)
	})
})

describe('ExpressionlessFeedbackUpdater', () => {
	type NewExpressionlessMigrationFeedback = Omit<NewCompanionMigrationFeedback, 'options'> & {
		options: ExpressionlessMigrationOptionValues
	}

	function feedbackWithExpressionlessOptions(
		feedbackId: string,
		options: ExpressionlessMigrationOptionValues,
	): NewExpressionlessMigrationFeedback {
		return {
			feedbackId,
			id: 'identifier',
			controlId: '3/5/7',
			options,
		}
	}

	function runExpressionlessUpgradeScript(
		feedback: NewExpressionlessMigrationFeedback,
		tryUpdate: TryUpdateExpressionlessFeedback,
	): CompanionMigrationFeedback | null {
		const result = ExpressionlessFeedbackUpdater(tryUpdate)(null as any, {
			config: null,
			secrets: undefined,
			actions: [],
			feedbacks: [structuredClone(feedback)],
		})
		return result.updatedFeedbacks[0] ?? null
	}

	test("doesn't apply", () => {
		const feedback = feedbackWithExpressionlessOptions('feedbackId', {
			x: {
				isExpression: false,
				value: 'hi',
			},
		})

		const migrated = runExpressionlessUpgradeScript(feedback, (feedback) => {
			if (feedback.feedbackId !== 'not-feedbackId') {
				return false
			}

			encloseEveryOptionValueInObject(feedback.options)
			return true
		})

		expect(migrated, "feedback updater that doesn't apply").toBeNull()
	})

	test('does apply', () => {
		const feedback = feedbackWithExpressionlessOptions('applicable', {
			x: {
				isExpression: false,
				value: 'hi',
			},
		})

		const migrated = runExpressionlessUpgradeScript(feedback, (feedback) => {
			if (feedback.feedbackId !== 'applicable') {
				return false
			}

			encloseEveryOptionValueInObject(feedback.options)
			return true
		})

		expect(migrated, 'feedback updater that applies').toEqual(
			Object.assign(structuredClone(feedback), {
				options: {
					x: {
						isExpression: false,
						value: {
							value: 'hi',
						},
					},
				},
			}),
		)
	})

	test('property move', () => {
		const feedback = feedbackWithExpressionlessOptions('to-move', {
			old1: {
				isExpression: false,
				value: 'bye',
			},
		})

		const migrated = runExpressionlessUpgradeScript(feedback, (feedback) => {
			if (feedback.feedbackId !== 'to-move') {
				return false
			}

			renameOption(feedback.options, 'old1', 'new2')
			return true
		})

		expect(migrated, 'feedback updater that applies').toEqual(
			Object.assign(structuredClone(feedback), {
				options: {
					new2: {
						isExpression: false,
						value: 'bye',
					},
				},
			}),
		)
	})

	test('property deletion', () => {
		const feedback = feedbackWithExpressionlessOptions('has-deletable-property', {
			toDelete: {
				isExpression: false,
				value: 'neener',
			},
		})

		const migrated = runExpressionlessUpgradeScript(feedback, (feedback) => {
			if (feedback.feedbackId !== 'has-deletable-property') {
				return false
			}

			delete feedback.options.toDelete
			return true
		})

		expect(migrated, 'feedback updater with property deletion').toEqual(
			Object.assign(structuredClone(feedback), {
				options: {},
			}),
		)
	})
})
