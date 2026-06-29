import type {
	CompanionMigrationOptionValues,
	CompanionOptionValues,
	ExpressionOrValue,
	JsonValue,
} from '@companion-module/base'
import type {
	NewCompanionMigrationAction,
	NewCompanionMigrationFeedback,
	OldCompanionMigrationAction,
	OldCompanionMigrationFeedback,
	UpgradeScript,
} from './types.js'

function keyRepr(key: string | symbol): string {
	if (typeof key === 'string') {
		return JSON.stringify(key)
	}
	return key.toString()
}

const NewOptionsToOldOptionsProxyMap = new WeakMap<CompanionMigrationOptionValues, CompanionOptionValues>()

const NewOptionsToOldOptionsHandler: ProxyHandler<CompanionMigrationOptionValues> = {
	get(realOptions: CompanionMigrationOptionValues, id: string | symbol, receiver: unknown): unknown {
		const realval = Reflect.get(realOptions, id, receiver) as unknown
		if (realval === undefined) {
			return realval
		}
		if (realval === null || typeof realval !== 'object') {
			throw new TypeError(`Invalid option ${id.toString()} read, value ${JSON.stringify(realval)}`)
		}

		const { isExpression, value } = realval as { isExpression: unknown; value: unknown }
		if (isExpression !== false) {
			throw new TypeError(`Invalid option ${id.toString()}: unexpected isExpression`)
		}

		return value
	},
	getOwnPropertyDescriptor(realOptions: CompanionMigrationOptionValues, id: string | symbol) {
		const realDesc = Reflect.getOwnPropertyDescriptor(realOptions, id)
		if (realDesc === undefined) {
			return undefined
		}

		if (!('value' in realDesc)) {
			throw new Error(`Can't proxy ${keyRepr(id)} accessor property`)
		}

		const exprOrVal = realDesc.value
		if (
			exprOrVal === null ||
			typeof exprOrVal !== 'object' ||
			!('isExpression' in exprOrVal) ||
			!('value' in exprOrVal)
		) {
			throw new Error(`Option ${keyRepr(id)} present not as ExpressionOrValue`)
		}

		const { isExpression, value } = exprOrVal as ExpressionOrValue<JsonValue | undefined>
		if (isExpression) {
			throw new Error(`Option ${keyRepr(id)} unexpectedly present as an expression`)
		}

		return {
			...realDesc,
			value,
		}
	},
	set(
		realOptions: CompanionMigrationOptionValues,
		id: string | symbol,
		newValue: unknown,
		_receiver: unknown,
	): boolean {
		return Reflect.set(realOptions, id, { isExpression: false, value: newValue }, realOptions)
	},
	defineProperty(
		realOptions: CompanionMigrationOptionValues,
		id: string | symbol,
		descriptor: TypedPropertyDescriptor<unknown>,
	) {
		if (!('value' in descriptor)) {
			throw new Error(`Can't define ${keyRepr(id)} as an accessor`)
		}
		return Reflect.defineProperty(realOptions, id, {
			...descriptor,
			value: { isExpression: false, value: descriptor.value },
		})
	},
}

function proxyNewOptionsToOld(options: CompanionMigrationOptionValues): CompanionOptionValues {
	return new Proxy(options, NewOptionsToOldOptionsHandler) as CompanionOptionValues
}

function proxyNewIsInvertedToOld(isInverted: ExpressionOrValue<JsonValue | undefined>): boolean {
	if (isInverted.isExpression) {
		throw new TypeError(`Unexpected isInverted value with isExpression=true`)
	}
	return Boolean(isInverted.value)
}

type EntityTypeMap = {
	action: NewCompanionMigrationAction
	feedback: NewCompanionMigrationFeedback
}

type EntityType = keyof EntityTypeMap

function MigrationEntityHandlers(): {
	[Type in EntityType]: ProxyHandler<EntityTypeMap[Type]>
} {
	function handler<Type extends EntityType>(type: Type): ProxyHandler<EntityTypeMap[Type]> {
		type CompanionMigrationEntity = EntityTypeMap[Type]
		return {
			get(actionOrFeedbackTarget: CompanionMigrationEntity, p: string | symbol, receiver: unknown): unknown {
				const actual = Reflect.get(actionOrFeedbackTarget, p, receiver) as unknown
				passthrough: if (p === 'options' || (type === 'feedback' && p === 'isInverted')) {
					if (actual === undefined) {
						break passthrough
					}

					switch (typeof actual) {
						case 'object':
							if (actual === null) {
								break passthrough
							}
							break
						case 'function':
							break
						default:
							break passthrough
					}

					if (p === 'isInverted') {
						return proxyNewIsInvertedToOld(actual as ExpressionOrValue<JsonValue | undefined>)
					}

					const realOptions = actual as CompanionMigrationOptionValues
					let optionsProxy = NewOptionsToOldOptionsProxyMap.get(realOptions)
					if (optionsProxy === undefined) {
						optionsProxy = proxyNewOptionsToOld(realOptions)
						NewOptionsToOldOptionsProxyMap.set(realOptions, optionsProxy)
					}
					return optionsProxy
				}

				// Delegate to the actual object.
				return actual
			},
			getOwnPropertyDescriptor(
				actionOrFeedbackTarget: CompanionMigrationEntity,
				p: string | symbol,
			): TypedPropertyDescriptor<unknown> {
				const actualDesc = Reflect.getOwnPropertyDescriptor(
					actionOrFeedbackTarget,
					p,
				) as TypedPropertyDescriptor<unknown>
				passthrough: if (p === 'options' || (type === 'feedback' && p === 'isInverted')) {
					if (actualDesc === undefined || !('value' in actualDesc)) {
						break passthrough
					}

					const val = actualDesc.value
					switch (typeof val) {
						case 'object':
							if (val === null) {
								break passthrough
							}
							break
						case 'function':
							break
						default:
							break passthrough
					}

					let value: unknown
					if (p === 'isInverted') {
						value = proxyNewIsInvertedToOld(val as ExpressionOrValue<JsonValue | undefined>)
					} else {
						const realOptions = val as CompanionMigrationOptionValues
						let optionsProxy = NewOptionsToOldOptionsProxyMap.get(realOptions)
						if (optionsProxy === undefined) {
							optionsProxy = proxyNewOptionsToOld(realOptions)
							NewOptionsToOldOptionsProxyMap.set(realOptions, optionsProxy)
						}
						value = optionsProxy
					}

					return {
						...actualDesc,
						value,
					}
				}

				// Delegate to the original object.
				return actualDesc
			},
		}
	}

	return {
		action: handler('action'),
		feedback: handler('feedback'),
	}
}

const { action: MigrationActionHandler, feedback: MigrationFeedbackHandler } = MigrationEntityHandlers()

function proxyNewMigrationActionToOld(action: NewCompanionMigrationAction): OldCompanionMigrationAction {
	return new Proxy(action, MigrationActionHandler) as OldCompanionMigrationAction
}

function proxyNewMigrationFeedbackToOld(feedback: NewCompanionMigrationFeedback): OldCompanionMigrationFeedback {
	return new Proxy(feedback, MigrationFeedbackHandler) as unknown as OldCompanionMigrationFeedback
}

export type TryUpdateExpressionlessAction = (action: OldCompanionMigrationAction) => boolean

export function ExpressionlessActionUpdater(tryUpdate: TryUpdateExpressionlessAction): UpgradeScript {
	return (_context, props) => {
		return {
			updatedActions: props.actions.filter((action) => {
				return tryUpdate(proxyNewMigrationActionToOld(action))
			}),
			updatedFeedbacks: [],
			updatedConfig: null,
			updatedSecrets: null,
		}
	}
}

export type TryUpdateExpressionlessFeedback = (action: OldCompanionMigrationFeedback) => boolean

export function ExpressionlessFeedbackUpdater(tryUpdate: TryUpdateExpressionlessFeedback): UpgradeScript {
	return (_context, props) => {
		return {
			updatedActions: [],
			updatedFeedbacks: props.feedbacks.filter((feedback) => {
				return tryUpdate(proxyNewMigrationFeedbackToOld(feedback))
			}),
			updatedConfig: null,
			updatedSecrets: null,
		}
	}
}
