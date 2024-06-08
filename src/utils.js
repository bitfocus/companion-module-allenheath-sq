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

/**
 *
 * @param {number} VC
 * @param {number} VF
 * @param {import('./mixer/mixer.js').FaderLaw} typ
 * @returns {string}
 */
export function decTodB(VC, VF, typ) {
	let dec, val

	switch (typ) {
		case 'LinearTaper':
			dec = parseInt(VC.toString(2) + ('0000000' + VF.toString(2)).slice(-7), 2)
			val = parseFloat((dec - 15196) / 118.775).toFixed(1)
			if (val > 10) {
				val = 10
			}
			if (val < -89) {
				val = '-inf'
			}
			break

		case 'AudioTaper':
			switch (true) {
				case 127 >= VC && VC > 115:
					val = parseFloat(10 - (127 - VC) / 3).toFixed(1)
					break

				case 115 >= VC && VC > 99:
					val = parseFloat(5 - (115 - VC) / 4).toFixed(1)
					break

				case 99 >= VC && VC > 79:
					val = parseFloat(0 - (99 - VC) / 5).toFixed(1)
					break

				case 79 >= VC && VC > 63:
					val = parseFloat(-5 - (79 - VC) / 4).toFixed(1)
					break

				case 63 >= VC && VC > 15:
					val = parseFloat(-10 - (63 - VC) / 1.778).toFixed(0)
					break

				case 15 >= VC:
					val = parseFloat(-40 - (15 - VC) / 0.2).toFixed(0)
					break
			}
			break
	}

	return val
}
