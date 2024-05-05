// Allen & Heath SQ Series

const { InstanceBase, InstanceStatus, runEntrypoint } = require('@companion-module/base')
const UpgradeScripts = require('./src/upgrades')

const config = require('./src/config')
const actions = require('./src/actions')
const feedbacks = require('./src/feedbacks')
const variables = require('./src/variables')
const presets = require('./src/presets')

const utils = require('./src/utils')
const api = require('./src/api')

const level = require('./src/level.json')
const callback = require('./src/callback.json')
const sqconfig = require('./src/sqconfig.json')

class sqInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		// Assign the methods from the listed files to this class
		Object.assign(this, {
			...config,
			...actions,
			...feedbacks,
			...variables,
			...presets,
			...utils,
			...api,
			...level,
			...callback,
			...sqconfig,
		})

		this.fdbState = {}
		this.lastValue = {}

		this.mch = 0xb0
	}

	async destroy() {
		if (this.midiSocket !== undefined) {
			this.midiSocket.destroy()
		}
	}

	async init(config) {
		this.configUpdated(config)
	}

	async configUpdated(config) {
		this.config = config

		this.setVariableValues({
			currentScene: 1,
		})

		if (this.config.model === undefined) {
			this.config.model = 'SQ7'
		}

		this.mch = parseInt('0xB' + (this.config.midich - 1).toString(16))

		this.updateStatus(InstanceStatus.Connecting)

		this.initActions()
		this.initFeedbacks()
		this.initVariables()
		this.initPresets()

		//this.checkVariables();
		this.checkFeedbacks()

		this.initTCP()
	}
}

runEntrypoint(sqInstance, UpgradeScripts)
