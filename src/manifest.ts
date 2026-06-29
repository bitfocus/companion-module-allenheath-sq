import type { SQActions } from './actions/manifest.js'
import type { SQVariables } from './variables/manifest.js'

export interface SQManifest {
	actions: SQActions
	variables: SQVariables
}
