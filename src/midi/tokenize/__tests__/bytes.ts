export const SysExStart = 0xf0
export const SysExEnd = 0xf7

export const SysCommonTimeCodeQuarterFrame = 0xf1
export const SysCommonSongPosition = 0xf2
export const SysCommonSongSelect = 0xf3
export const SysCommonTuneRequest = 0xf6

export const SysRTTimingClock = 0xf8
export const SysRTContinue = 0xfb

export const SysExMessage = [SysExStart, 0x00, SysExEnd] as const
export const SysExMessageShortest = [SysExStart, SysExEnd] as const

export const SysCommonSingleByte = [SysCommonTuneRequest] as const
export const SysCommonMultiByte = [SysCommonSongPosition, 0x12, 0x34] as const

export const SysCommonSongPosMessage = [SysCommonSongPosition, 0x00, 0x03] as const
