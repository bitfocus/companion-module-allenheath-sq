import type { SQActions } from './actions/manifest.js'
import type { SQConfig, SQSecrets } from './config.js'
import type { SQFeedbacks } from './feedbacks/manifest.js'
import type { SQVariables } from './variables/manifest.js'

export interface SQManifest {
	actions: SQActions
	config: SQConfig
	feedbacks: SQFeedbacks
	secrets: SQSecrets
	variables: SQVariables
}
