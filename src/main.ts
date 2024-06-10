import { runEntrypoint } from '@companion-module/base'
import { sqInstance } from './instance.js'
import { UpgradeScripts } from './upgrades.js'

runEntrypoint(sqInstance, UpgradeScripts)
