import type { CompanionPresetGroupTemplate } from '@companion-module/base'
import type { SQManifest } from '../../manifest.js'

export type TemplateValue = CompanionPresetGroupTemplate<SQManifest>['templateValues'][0]
