/**
 * A user-friendly specification of a MIDI channel, from MIDI channel 1 to 16.
 */
export type UserMidiChannel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16

/**
 * Determine whether `n` is the user-level specification of a MIDI channel, i.e.
 * an integer in range `[1, 16]`.
 */
export function isUserMidiChannel(n: number): n is UserMidiChannel {
	return 1 <= n && n <= 16 && (n | 0) === n
}

/**
 * The binary encoding-level specification of a MIDI channel in range `[0, 16)`.
 */
export type MidiChannel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15

export function toMidiChannel(userChannel: UserMidiChannel): MidiChannel {
	return (userChannel - 1) as MidiChannel
}
