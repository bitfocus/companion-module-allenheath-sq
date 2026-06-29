import type { InstanceTypes } from '@companion-module/base'
import type { SQActions } from './actions/manifest.js'
import type { SQConfig, SQSecrets } from './config.js'
import type { SQFeedbacks } from './feedbacks/manifest.js'
import type { SQVariables } from './variables/manifest.js'

/** Full module typing information. */
export interface SQManifest extends InstanceTypes {
	actions: SQActions
	config: SQConfig
	feedbacks: SQFeedbacks
	secrets: SQSecrets
	variables: SQVariables
}
