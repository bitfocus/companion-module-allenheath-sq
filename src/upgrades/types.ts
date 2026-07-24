import type {
	CompanionStaticUpgradeProps,
	CompanionStaticUpgradeScript,
	CompanionUpgradeContext,
} from '@companion-module/base'
import type { SQConfig } from '../config.js'

export type UpgradeContext = CompanionUpgradeContext<SQConfig>
export type UpgradeProps = CompanionStaticUpgradeProps<SQConfig>
export type UpgradeScript = CompanionStaticUpgradeScript<SQConfig>
