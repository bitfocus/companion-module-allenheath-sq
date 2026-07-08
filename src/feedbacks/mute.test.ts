import type { CompanionMigrationFeedback } from '@companion-module/base'
import { describe, expect, test } from 'vitest'
import { MuteFeedbackId, tryMakeMuteFeedbackItemOneIndexed } from './mute.js'

function makeZeroIndexedMuteFeedback(feedbackId: MuteFeedbackId, channel: number): CompanionMigrationFeedback {
	return {
		feedbackId,
		controlId: '0/1/2',
		id: 'hello-world',
		options: {
			...(feedbackId === MuteFeedbackId.MuteLR ? {} : { channel }),
		},
		isInverted: false,
	}
}

describe('mute feedback zero-indexed to one-indexed upgrading', () => {
	test('lr upgrading', () => {
		const feedback = makeZeroIndexedMuteFeedback(MuteFeedbackId.MuteLR, 42)
		expect(feedback.options).toEqual({})

		expect(tryMakeMuteFeedbackItemOneIndexed(feedback)).toBe(false)
		expect(feedback.options).toEqual({})

		expect(tryMakeMuteFeedbackItemOneIndexed(feedback)).toBe(false)
		expect(feedback.options).toEqual({})
	})

	test.each([
		[MuteFeedbackId.MuteDCA, 2],
		[MuteFeedbackId.MuteFXReturn, 0],
		[MuteFeedbackId.MuteFXSend, 1],
		[MuteFeedbackId.MuteGroup, 3],
		[MuteFeedbackId.MuteInputChannel, 37],
		[MuteFeedbackId.MuteMatrix, 2],
		[MuteFeedbackId.MuteMix, 3],
		[MuteFeedbackId.MuteMuteGroup, 2],
	] satisfies [MuteFeedbackId, number /* zero-indexed */][])('$0 channel=$1', (feedbackId, channel) => {
		const feedback = makeZeroIndexedMuteFeedback(feedbackId, channel)
		expect(feedback.options).toEqual({
			channel,
		})

		expect(tryMakeMuteFeedbackItemOneIndexed(feedback)).toBe(true)
		expect(feedback.options).toEqual({
			n: channel + 1,
		})

		expect(tryMakeMuteFeedbackItemOneIndexed(feedback)).toBe(false)
		expect(feedback.options).toEqual({
			n: channel + 1,
		})
	})

	test('inapplicable feedback', () => {
		const feedback: CompanionMigrationFeedback = {
			feedbackId: 'jimi-hendrix',
			id: 'threeve',
			controlId: '6/5/0',
			options: {
				channel: 3,
				n: 17,
			},
			isInverted: true,
		}

		expect(tryMakeMuteFeedbackItemOneIndexed(feedback)).toBe(false)
		expect(feedback.options).toEqual({
			channel: 3,
			n: 17,
		})

		expect(tryMakeMuteFeedbackItemOneIndexed(feedback)).toBe(false)
		expect(feedback.options).toEqual({
			channel: 3,
			n: 17,
		})
	})
})
