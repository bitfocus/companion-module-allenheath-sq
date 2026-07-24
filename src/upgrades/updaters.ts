import type { CompanionMigrationAction } from '@companion-module/base'
import type { RawConfig } from '../config.js'
import type { UpgradeContext, UpgradeProps, UpgradeScript } from './types.js'

export function ActionUpdater(tryUpdate: (action: CompanionMigrationAction) => boolean): UpgradeScript {
	return (_context: UpgradeContext, props: UpgradeProps) => {
		return {
			updatedActions: props.actions.filter(tryUpdate),
			updatedFeedbacks: [],
			updatedConfig: null,
		}
	}
}

export function ConfigUpdater(tryUpdate: (config: RawConfig) => boolean): UpgradeScript {
	return (_context: UpgradeContext, props: UpgradeProps) => {
		return {
			updatedActions: [],
			updatedFeedbacks: [],
			updatedConfig: props.config !== null && tryUpdate(props.config) ? props.config : null,
		}
	}
}
