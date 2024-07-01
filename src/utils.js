/**
 * @param {import('./instance-interface.js').Level} lv
 * @param {import('./mixer/mixer.js').FaderLaw} typ
 * @returns
 */
export function dBToDec(lv, typ) {
	let VC, VF, val, bin
	if (lv == '-inf') return [0, 0]

	switch (typ) {
		case 'LinearTaper':
			lv = parseFloat(lv)
			val = 15196 + lv * 118.775
			bin = Math.round(val).toString(2)
			VC = parseInt(bin.slice(0, -7), 2)
			VF = parseInt(bin.slice(-7), 2)
			break

		case 'AudioTaper':
			lv = parseFloat(lv)
			switch (true) {
				case 10 >= lv && lv > 5:
					VC = 127 - (10 - lv) * 3
					break

				case 5 >= lv && lv > 0:
					VC = 115 - (5 - lv) * 4
					break

				case 0 >= lv && lv > -5:
					VC = 99 + (0 - lv) * 5
					break

				case -5 >= lv && lv > -10:
					VC = 79 + (5 + lv) * 4
					break

				case -10 >= lv && lv > -40:
					VC = parseFloat(63 + (10 + lv) * 1.778).toFixed(2)
					break

				case -40 >= lv:
					VC = parseFloat(15 + (40 + lv) * 0.2).toFixed(2)
					break
			}

			if (VC - parseInt(VC) > 0) {
				VF = (VC - parseInt(VC)) * 100
				VC = parseInt(VC)
			} else {
				VF = 0
			}
			break
	}

	return [VC, VF]
}
