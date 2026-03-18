import type { CompanionOptionValues } from '@companion-module/base'
import type { sqInstance } from '../instance.js'

const UseVariableSuffix = '__useVar'
const VariableOptionSuffix = '_var'

async function resolveOptionValue(
	parse: (value: string) => Promise<string>,
	optionValue: CompanionOptionValues[keyof CompanionOptionValues],
): Promise<CompanionOptionValues[keyof CompanionOptionValues]> {
	if (typeof optionValue === 'string') {
		return parse(optionValue)
	}

	if (Array.isArray(optionValue)) {
		const resolvedArray: (string | number)[] = []
		for (const item of optionValue) {
			if (typeof item === 'string') {
				resolvedArray.push(await parse(item))
			} else {
				resolvedArray.push(item)
			}
		}

		return resolvedArray
	}

	return optionValue
}

function parseArrayOverride(value: string): (string | number)[] {
	try {
		const parsed = JSON.parse(value)
		if (Array.isArray(parsed)) {
			const out: (string | number)[] = []
			for (const item of parsed) {
				if (typeof item === 'number' || typeof item === 'string') {
					out.push(item)
				}
			}
			if (out.length > 0) {
				return out
			}
		}
	} catch {
		// Fall through to CSV parsing.
	}

	return value
		.split(',')
		.map((item) => item.trim())
		.filter((item) => item.length > 0)
		.map((item) => {
			const n = Number(item)
			return Number.isFinite(n) && item !== '' ? n : item
		})
}

/**
 * Resolve all string option values in an action by parsing variables and local
 * variables.
 */
export async function resolveActionOptions(
	instance: sqInstance,
	options: CompanionOptionValues,
): Promise<CompanionOptionValues> {
	const resolved: CompanionOptionValues = { ...options }
	for (const key of Object.keys(options)) {
		resolved[key] = await resolveOptionValue((value) => instance.parseVariablesInString(value), options[key])
	}

	for (const key of Object.keys(resolved)) {
		if (!key.endsWith(UseVariableSuffix) || resolved[key] !== true) {
			continue
		}

		const baseOptionKey = key.slice(0, -UseVariableSuffix.length)
		const variableOptionKey = `${baseOptionKey}${VariableOptionSuffix}`
		const variableValue = resolved[variableOptionKey]
		if (typeof variableValue !== 'string' || variableValue.trim().length === 0) {
			continue
		}

		const existingBaseValue = resolved[baseOptionKey]
		if (Array.isArray(existingBaseValue)) {
			resolved[baseOptionKey] = parseArrayOverride(variableValue)
		} else {
			resolved[baseOptionKey] = variableValue
		}
	}

	return resolved
}
