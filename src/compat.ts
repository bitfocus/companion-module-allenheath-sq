/* eslint-disable no-restricted-imports */
import type {
	CompanionActionDefinition,
	CompanionInputFieldDropdown as NativeCompanionInputFieldDropdown,
	CompanionInputFieldMultiDropdown as NativeCompanionInputFieldMultiDropdown,
	CompanionInputFieldNumber as NativeCompanionInputFieldNumber,
	CompanionInputFieldTextInput as NativeCompanionInputFieldTextInput,
} from '@companion-module/base'

export type CompanionActionDefinitions<Actions extends Record<string, object>> = Record<
	keyof Actions,
	CompanionActionDefinition
>

export type CompanionInputFieldDropdown<
	_TKey extends string,
	_TChoiceId extends number | string = number | string,
> = NativeCompanionInputFieldDropdown

export type CompanionInputFieldMultiDropdown<
	_TKey extends string,
	_TChoiceId extends number | string = number | string,
> = NativeCompanionInputFieldMultiDropdown

export type CompanionInputFieldNumber<_TKey extends string = string> = NativeCompanionInputFieldNumber

export type CompanionInputFieldTextInput<_TKey extends string = string> = NativeCompanionInputFieldTextInput
