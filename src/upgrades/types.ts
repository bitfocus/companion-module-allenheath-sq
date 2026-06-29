import type {
	CompanionMigrationAction,
	CompanionMigrationFeedback,
	CompanionMigrationOptionValues,
	CompanionOptionValues,
	CompanionStaticUpgradeProps,
	CompanionStaticUpgradeScript,
	CompanionUpgradeContext,
	ExpressionOrValue,
} from '@companion-module/base'
import type { SQConfig, SQSecrets } from '../config.js'

export type UpgradeContext = CompanionUpgradeContext<SQConfig>
export type UpgradeProps = CompanionStaticUpgradeProps<SQConfig, SQSecrets>
export type UpgradeScript = CompanionStaticUpgradeScript<SQConfig>

export type TryUpdateAction = (action: CompanionMigrationAction) => boolean

export type TryUpdateFeedback = (feedback: CompanionMigrationFeedback) => boolean

/**
 * `CompanionMigrationAction` but with `options: CompanionOptionValues`
 * overriding whatever might already be there.
 */
export type OldCompanionMigrationAction = Omit<CompanionMigrationAction, 'options'> & {
	options: CompanionOptionValues
}
/**
 * `CompanionMigrationFeedback` but with `options: CompanionOptionValues`
 * overriding whatever might already be there.
 */
export type OldCompanionMigrationFeedback = Omit<CompanionMigrationFeedback, 'options' | 'isInverted'> & {
	options: CompanionOptionValues
	isInverted: boolean
}
/**
 * `CompanionMigrationAction` but with
 * `options: Record<string, ExpressionOrValue<JsonValue | undefined> | undefined>`
 * overriding whatever might already be there.
 */
export type NewCompanionMigrationAction = Omit<CompanionMigrationAction, 'options'> & {
	options: CompanionMigrationOptionValues
}
/**
 * `CompanionMigrationFeedback` but with
 * `options: Record<string, ExpressionOrValue<JsonValue | undefined> | undefined>`
 * overriding whatever might already be there.
 */
export type NewCompanionMigrationFeedback = Omit<CompanionMigrationFeedback, 'options' | 'isInverted'> & {
	options: CompanionMigrationOptionValues
	isInverted?: ExpressionOrValue<boolean>
}
