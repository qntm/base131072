var bitsToBits = require("./lib/bits-to-bits.js");

(function(){
	var output = bitsToBits(4, 2)([0b0000, 0b0011, 0b1111]);
	if(output[0] !== 0b00) { throw Error(); }
	if(output[1] !== 0b00) { throw Error(); }
	if(output[2] !== 0b00) { throw Error(); }
	if(output[3] !== 0b11) { throw Error(); }
	if(output[4] !== 0b11) { throw Error(); }
	if(output[5] !== 0b11) { throw Error(); }
	if(output.length !== 6) { throw Error(); }
}());

(function(){
	var output = bitsToBits(6, 5)([0b010010, 0b110101, 0b111110]);
	if(output[0] !== 0b01001) { throw Error(); }
	if(output[1] !== 0b01101) { throw Error(); }
	if(output[2] !== 0b01111) { throw Error(); }
	if(output.length !== 3) { throw Error(); }
}());

(function(){
	var leftovers = bitsToBits.leftovers(6, 5)([0b010010, 0b110101, 0b111110]);
	if(leftovers.iy !== 0b110) { throw Error(); }
	if(leftovers.iy_bits !== 2) { throw Error(); }
}());

(function(){
	var leftovers = bitsToBits.leftovers(8, 17)([0b00010101, 0b00010101, 0b00010101]);
	if(leftovers.iy !== 0b0010101) { throw Error(); }
	if(leftovers.iy_bits !== 10) { throw Error(); }
}());

(function(){
	var leftovers = bitsToBits.leftovers(8, 17)([0b00010101, 0b00010101, 0b00010101, 0b11111111]);
	if(leftovers.iy !== 0b001010111111111) { throw Error(); }
	if(leftovers.iy_bits !== 2) { throw Error(); }
}());
