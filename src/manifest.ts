import type { SQActions } from './actions/manifest.js'
import type { SQFeedbacks } from './feedbacks/manifest.js'
import type { SQVariables } from './variables/manifest.js'

export interface SQManifest {
	actions: SQActions
	feedbacks: SQFeedbacks
	variables: SQVariables
}
