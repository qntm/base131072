/**
	Generic bit-dicing method. Input an iterable of X-bit numbers, plus X and Y.
	Dice them around, returning an array of Y-bit numbers. Leftovers may be
	retrieved through different means.
*/
module.exports = function(x, y) {
	return function(input) {
		var output = [];
		var iy = 0; // a Y-bit number under gradual construction
		var iy_bits = y; // Number of bits needed to complete iy. This value is from 1 to Y inclusive.
		input.forEach(function(ix) {
			// ix is an X-bit number which we are consuming.
			var ix_bits = x; // Number of bits remaining to consume ix.
			while(ix_bits > 0) {
				// Number of bits to consume from ix and add to iy
				var c = Math.min(ix_bits, iy_bits);

				// Shift iy out by C bytes and insert the top C bytes of ix
				iy = (iy << c) + (ix >> (ix_bits - c));
				
				// Cut off the top C bytes of ix
				ix = ix & ((1 << (ix_bits - c)) - 1);

				ix_bits -= c;
				iy_bits -= c;
				if(iy_bits <= 0) {
					// B is complete.
					output.push(iy);
					iy = 0;
					iy_bits += y;
				}
			}
		});
		return output;
	};
};

module.exports.leftovers = function(x, y) {
	return function(input) {
		var obytes_produced = Math.floor(input.length * x / y);
		var bits_consumed = obytes_produced * y;

		// A Y-bit number under construction (it will NOT be completed)
		var iy = 0;

		// Number of bits needed to complete iy. This is from 0 to Y - 1 inclusive.
		var iy_bits = y - (input.length * x) % y;

		// First, consume enough additional bits to get us to an X-bit byte boundary.
		while(bits_consumed < input.length * x) {
			// Number of bits consumed of the current X-bit byte of input.
			var ibit = bits_consumed % x;

			// Index of this input byte.
			var ibyte = (bits_consumed - ibit) / x;

			// Number of bits still to consume of this input byte.
			var c = x - ibit;

			// Shift `iy` out by that many bits and insert them.
			iy = (iy << c) + (input[ibyte] & ((1 << c) - 1));

			bits_consumed += c;
		}

		return {
			iy: iy,
			iy_bits: iy_bits
		};
	};
};