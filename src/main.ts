import { runEntrypoint } from '@companion-module/base'
import { sqInstance } from './instance.js'
import { UpgradeScripts } from './upgrades/upgrades.js'

runEntrypoint(sqInstance, UpgradeScripts)
