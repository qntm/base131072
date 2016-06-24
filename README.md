# base131072

Base131072 is a binary encoding optimised for UTF-32-encoded text and Twitter; it is the intended successor to [Base65536](https://github.com/ferno/base65536). This JavaScript module, `base131072`, is an implementation of this encoding.

Efficiency ratings are averaged over long inputs. Higher is better.

<table>
	<thead>
		<tr>
			<th colspan="2" rowspan="2">Encoding</th>
			<th rowspan="2">Implementation</th>
			<th colspan="3">Efficiency</th>
		</tr>
		<tr>
			<th>UTF&#x2011;8</th>
			<th>UTF&#x2011;16</th>
			<th>UTF&#x2011;32</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td rowspan="5">ASCII&#x2011;constrained</td>
			<td>Unary</td>
			<td><code><a href="https://github.com/ferno/base1">base1</a></code></td>
			<td style="text-align: right;">0%</td>
			<td style="text-align: right;">0%</td>
			<td style="text-align: right;">0%</td>
		</tr>
		<tr>
			<td>Binary</td>
			<td>everywhere</td>
			<td style="text-align: right;">13%</td>
			<td style="text-align: right;">6%</td>
			<td style="text-align: right;">3%</td>
		</tr>
		<tr>
			<td>Hexadecimal</td>
			<td>everywhere</td>
			<td style="text-align: right;">50%</td>
			<td style="text-align: right;">25%</td>
			<td style="text-align: right;">13%</td>
		</tr>
		<tr>
			<td>Base64</td>
			<td>everywhere</td>
			<td style="text-align: right;">75%</td>
			<td style="text-align: right;">38%</td>
			<td style="text-align: right;">19%</td>
		</tr>
		<tr>
			<td>Base85</td>
			<td>everywhere</td>
			<td style="text-align: right;">80%</td>
			<td style="text-align: right;">40%</td>
			<td style="text-align: right;">20%</td>
		</tr>
		<tr>
			<td rowspan="3">BMP&#x2011;constrained</td>
			<td>HexagramEncode</td>
			<td><code><a href="https://github.com/ferno/hexagram-encode">hexagram-encode</a></code></td>
			<td style="text-align: right;">25%</td>
			<td style="text-align: right;">38%</td>
			<td style="text-align: right;">19%</td>
		</tr>
		<tr>
			<td>BrailleEncode</td>
			<td><code><a href="https://github.com/ferno/braille-encode">braille-encode</a></code></td>
			<td style="text-align: right;">33%</td>
			<td style="text-align: right;">50%</td>
			<td style="text-align: right;">25%</td>
		</tr>
		<tr>
			<td>Base32768</td>
			<td><code><a href="https://github.com/ferno/base32768">base32768</a></code></td>
			<td style="text-align: right;">63%</td>
			<td style="text-align: right;"><strong>94%</strong></td>
			<td style="text-align: right;">47%</td>
		</tr>
		<tr>
			<td rowspan="2">Full Unicode</td>
			<td>Base65536</td>
			<td><code><a href="https://github.com/ferno/base65536">base65536</a></code></td>
			<td style="text-align: right;">56%</td>
			<td style="text-align: right;">64%</td>
			<td style="text-align: right;">50%</td>
		</tr>
		<tr>
			<td>Base131072</td>
			<td><code><a href="https://github.com/ferno/base131072">base131072</a></code></td>
			<td style="text-align: right;">?</td>
			<td style="text-align: right;">?</td>
			<td style="text-align: right;"><strong>53%</strong></td>
		</tr>
	</tbody>
</table>

For example, using Base64, up to 105 bytes of binary data can fit in a Tweet. With Base131072, 297 bytes are possible. (297.5, in fact.)

## How does it work?

Base131072 is a 17-bit encoding. We take the input binary data as a sequence of 8-bit numbers, compact it into a sequence of bits, then dice the bits up again to make a sequence of 17-bit numbers. We then encode each of these 2<sup>17</sup> = 131,072 possible numbers as a different Unicode code point.

### Padding

Note that the final 17-bit number in the sequence is likely to be "incomplete", i.e. missing some of its bits. We need to signal this fact in the output string somehow. Here's how we handle those cases.

#### Final 17-bit number has 1 to 7 missing bits

In the following cases:

	bbbbbbbbcccccccc_ // 1 missing bit
	bbbbbbbcccccccc__ // 2 missing bits
	bbbbbbcccccccc___ // 3 missing bits
	bbbbbcccccccc____ // 4 missing bits (note: this is how a Tweet containing 297 bytes of data will end)
	bbbbcccccccc_____ // 5 missing bits
	bbbcccccccc______ // 6 missing bits
	bbcccccccc_______ // 7 missing bits

we pad the incomplete 17-bit number out to 17 bits using 1s:

	bbbbbbbbcccccccc1
	bbbbbbbcccccccc11
	bbbbbbcccccccc111
	bbbbbcccccccc1111
	bbbbcccccccc11111
	bbbcccccccc111111
	bbcccccccc1111111

and then encode as normal using our 2<sup>17</sup>-bit repertoire. On decoding, we get a series of 8-bit values, the last of which will be incomplete apart from those padding bits, like so:

	1_______
	11______
	111_____
	1111____
	11111___
	111111__
	1111111_

We check this and discard this final incomplete value.

#### Final 17-bit number has 8 to 15 missing bits

In the following cases:

	bcccccccc________ // 8 missing bits
	cccccccc_________ // 9 missing bits
	ccccccc__________ // 10 missing bits
	cccccc___________ // 11 missing bits
	ccccc____________ // 12 missing bits (note: this is how a Tweet containing 296 bytes of data will end)
	cccc_____________ // 13 missing bits
	ccc______________ // 14 missing bits
	cc_______________ // 15 missing bits

we encode them differently. We'll pad the incomplete number out to only 9 bits using 1s:

	bcccccccc
	cccccccc1
	ccccccc11
	cccccc111
	ccccc1111
	cccc11111
	ccc111111
	cc1111111

and then encode them using a completely different, 2<sup>9</sup>-character repertoire. On decoding, we will treat that character differently, returning 9 bits (rather than 17 from characters in the main repertoire). After dicing the bit stream into 8-bit values again, there could be no final incomplete value, in which case no further processing is needed. Or there could be one:

	1_______
	11______
	111_____
	1111____
	11111___
	111111__
	1111111_

which we check, acknowledge and discard.

#### Final 17-bit number has 16 missing bits

In this final case:

	c________________ // 16 missing bits

we simply take this as a 1-bit number:

	c

and encode it using a third, 2<sup>1</sup>-character repertoire. Again, on decoding, this is treated specially, and only 1 bit is added to the stream, rather than 9 or 17 as for the other characters.

We will find that there is no extraneous padding on decoding. We will get back a sequence of complete 8-bit values and nothing else.

In other words, Base131072 is a slight misnomer. It uses not 131,072 but 2<sup>17</sup> + 2<sup>9</sup> + 2<sup>1</sup> = 131,586 characters for its three repertoires. Of course, Base64 uses a 65th character for its padding too.

## Is this ready yet?

No. We need 131,586 "safe" characters for this encoding, but as of Unicode 8.0 only 101,064 exist. (A calculation for Unicode 9.0 is forthcoming but we know already that it's not enough.) However, future versions of Unicode may add enough safe characters for this to be made possible. In any case, the groundwork can certainly be laid.
