/** Base131072 is a binary-to-text encoding optimised for UTF-32 and Twitter. */
var bitsToBits = require("./lib/bits-to-bits.js");

var MAGIC_NUMBER_A = 17; // This is a 17-bit encoding.
var MAGIC_NUMBER_B = 8;  // Bits in a byte

module.exports = {

	/**
		If `repertoire` is 0, encode a 17-bit number K to a Unicode code point.
		If `repertoire` is 1, encode a 9-bit number K to a Unicode code point from
		the special repertoire.
		If `repertoire` is 2, encode a 1-bit number K to a Unicode code point from
		the extra-special repertoire.
		Throw an exception on an unrecognised repertoire.
		TODO
	*/
	encode_k: function(k, repertoire) {
		return k;
	},

	/**
		Main Base131072 encoding method. Take a Buffer as input and return a
		String as output.
	*/
	encode: function(buf) {
		var bytes = [...buf.values()];
		var result = bitsToBits(bytes, MAGIC_NUMBER_B, MAGIC_NUMBER_A);
		var ks = result.output;
		var codePoints = ks.map(k => this.encode_k(k, 0));

		// Don't forget the padding! This will add one more character to the string.
		if(result.iy_bits !== MAGIC_NUMBER_A) {

			// iy = abbbbbbbbcccccccc, iy_bits = 0 (this should never happen really)
			// iy = bbbbbbbbcccccccc, iy_bits = 1
			// iy = bbbbbbbcccccccc, iy_bits = 2
			// iy = bbbbbbcccccccc, iy_bits = 3
			// iy = bbbbbcccccccc, iy_bits = 4 (note: this is how a Tweet containing 297 bytes of data will end)
			// iy = bbbbcccccccc, iy_bits = 5
			// iy = bbbcccccccc, iy_bits = 6
			// iy = bbcccccccc, iy_bits = 7
			// => Pad `iy` out to 17 bits using 1s, then encode as normal

			// iy = bcccccccc, iy_bits = 8
			// iy = cccccccc, iy_bits = 9
			// iy = ccccccc, iy_bits = 10
			// iy = cccccc, iy_bits = 11
			// iy = ccccc, iy_bits = 12 (note: this is how a Tweet containing 296 bytes of data will end)
			// iy = cccc, iy_bits = 13
			// iy = ccc, iy_bits = 14
			// iy = cc, iy_bits = 15
			// => Pad `iy` out to 9 bits using 1s, then encode specially

			// iy = c, iy_bits = 16
			// => Pad `iy` out to 1 bit using 1s, then encode extra-specially

			// First, take `iy` and pad it out with 1s to 1, 9 or 17 bits, whichever is lowest.
			var padBits = result.iy_bits % MAGIC_NUMBER_B;
			var k = (result.iy << padBits) + ((1 << padBits) - 1);

			// Now which repertoire will we use? 0, 1 or 2?
			var repertoire = (result.iy_bits - padBits) / MAGIC_NUMBER_B;

			codePoints.append(this.encode_k(k, repertoire));
		}

		var chars = codePoints.map(codePoint => String.fromCodePoint(codePoint));
		var str = chars.join("");
		return str;
	},

	/**
		If `repertoire` is 0, decode a Unicode code point to a 17-bit number K.
		If `repertoire` is 1, decode a Unicode code point to a 9-bit number K
		using the special repertoire.
		If `repertoire` is 2, decode a Unicode code point to a 1-bit number K
		using the extra-special repertoire.
		Throw an exception on an unrecognised code point or repertoire.
		TODO
	*/
	decode_codePoint: function(codePoint, repertoire) {
		return codePoint;
	},

	/**
		Main Base131072 decoding method. Take a String as input and return a Buffer
		as output, or throw an exception if the input contains invalid Base131072.
	*/
	decode: function(str) {
		var chars = [...str];
		var codePoints = chars.map(ch => ch.codePointAt(0));

		// Special case for the final character, which may be padding.
		var k;
		if(codePoints.length > 0) {
			var codePoint = codePoints.pop();
			var repertoire = 0;
			while(k === undefined) {
				try { 
					k = this.decode_codePoint(codePoint, repertoire);
				} catch(e) {
					if(e.message !== "Bad code point") {
						throw e;
					}
				}
				repertoire++;
			}
		}

		var ks = codePoints.map(codePoint => this.decode_codePoint(codePoint, 0));

		if(k !== undefined) {
			ks.push(k);
		}

		var result = bitsToBits(ks, MAGIC_NUMBER_A, MAGIC_NUMBER_B));
		var bytes = result.output;

		// Remember how we always pad with 1s?
		if(result.iy !== ((1 << result.iy_bits) - 1)) {
			throw new Error();
		}

		var buf = Buffer(bytes);
		return buf;
	}
};
