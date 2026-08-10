/* eslint-disable no-restricted-imports */
import type {
	CompanionActionDefinition,
	CompanionInputFieldDropdown as NativeCompanionInputFieldDropdown,
	CompanionInputFieldNumber as NativeCompanionInputFieldNumber,
} from '@companion-module/base'

export type CompanionActionDefinitions<Actions extends Record<string, object>> = Record<
	keyof Actions,
	CompanionActionDefinition
>

export type CompanionInputFieldDropdown<
	_TKey extends string,
	_TChoiceId extends number | string = number | string,
> = NativeCompanionInputFieldDropdown

export type CompanionInputFieldNumber<_TKey extends string = string> = NativeCompanionInputFieldNumber
