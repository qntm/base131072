# base131072

Base131072 is a binary encoding optimised for UTF-32-encoded text and Twitter.

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

Base131072 is a 17-bit encoding. Essentially, we take the input binary data as a sequence of 8-bit numbers, compact it into a sequence of bits, then dice the bits up again to make a sequence of 17-bit numbers. We then encode each of these 2^17 = 131,072 possible numbers as a different Unicode code point.

### Padding

Note that the final 17-bit number in the sequence is likely to be "incomplete", i.e. missing some of its bits. We need to signal this fact in the output string somehow. Here's how we handle those cases.

#### Final 17-bit number has 1 to 7 missing bits

In the following cases:

	bbbbbbbbcccccccc_ // 1 missing bits
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

and then encode as normal using our 2^17-bit repertoire. On decoding, there will be up to 7 extraneous padding 1s, which we acknowledge and discard.

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

and then encode them using a completely different, 2^9-character repertoire. On decoding, there will be up to 7 extraneous padding 1s, which we discard.

#### Final 17-bit number has 16 missing bits

In this final case:

	c________________ // 16 missing bits

we simply take this as a 1-bit number:

	c

and encode it using a third, 2^1-character repertoire. There is no extraneous padding on decoding.

In other words, we use a total of 2^17 + 2^9 + 2^1 = 131,585 characters for this encoding.