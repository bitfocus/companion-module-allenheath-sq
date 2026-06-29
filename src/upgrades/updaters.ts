import type { SQConfig } from '../config.js'
import type { TryUpdateAction, TryUpdateFeedback, UpgradeContext, UpgradeProps, UpgradeScript } from './types.js'

export function ActionUpdater(tryUpdate: TryUpdateAction): UpgradeScript {
	return (_context: UpgradeContext, props: UpgradeProps) => {
		return {
			updatedActions: props.actions.filter(tryUpdate),
			updatedFeedbacks: [],
			updatedConfig: null,
			updatedSecrets: null,
		}
	}
}

export function ConfigUpdater(tryUpdate: (config: SQConfig) => boolean): UpgradeScript {
	return (_context: UpgradeContext, props: UpgradeProps) => {
		return {
			updatedActions: [],
			updatedFeedbacks: [],
			updatedConfig: props.config !== null && tryUpdate(props.config) ? props.config : null,
			updatedSecrets: null,
		}
	}
}

export function FeedbackUpdater(tryUpdate: TryUpdateFeedback): UpgradeScript {
	return (_context: UpgradeContext, props: UpgradeProps) => {
		return {
			updatedActions: [],
			updatedFeedbacks: props.feedbacks.filter(tryUpdate),
			updatedConfig: null,
			updatedSecrets: null,
		}
	}
}
