import type { CompanionActionDefinition } from '@companion-module/base'

export type CompanionActionDefinitions<Actions extends Record<string, object>> = Record<
	keyof Actions,
	CompanionActionDefinition
>
