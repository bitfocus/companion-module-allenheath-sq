/* eslint-disable no-restricted-imports */
import type {
	CompanionActionDefinition,
	CompanionInputFieldNumber as NativeCompanionInputFieldNumber,
} from '@companion-module/base'

export type CompanionActionDefinitions<Actions extends Record<string, object>> = Record<
	keyof Actions,
	CompanionActionDefinition
>

export type CompanionInputFieldNumber<_TKey extends string = string> = NativeCompanionInputFieldNumber
