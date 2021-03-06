# base131072

Base131072 is a binary encoding optimised for UTF-32-encoded text and Twitter; it is the intended successor to [Base65536](https://github.com/ferno/base65536). This JavaScript module, `base131072`, is an implementation of this encoding... however, it can't be used yet because there aren't enough safe Unicode characters.

Efficiency ratings are averaged over long inputs. Higher is better.

<table>
  <thead>
    <tr>
      <th colspan="2" rowspan="2">Encoding</th>
      <th colspan="3">Efficiency</th>
      <th rowspan="2">Bytes per Tweet *</th>
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
      <td>Unary / <a href="https://github.com/ferno/base1">Base1</a></td>
      <td style="text-align: right;">0%</td>
      <td style="text-align: right;">0%</td>
      <td style="text-align: right;">0%</td>
      <td style="text-align: right;">1</td>
    </tr>
    <tr>
      <td>Binary</td>
      <td style="text-align: right;">13%</td>
      <td style="text-align: right;">6%</td>
      <td style="text-align: right;">3%</td>
      <td style="text-align: right;">35</td>
    </tr>
    <tr>
      <td>Hexadecimal</td>
      <td style="text-align: right;">50%</td>
      <td style="text-align: right;">25%</td>
      <td style="text-align: right;">13%</td>
      <td style="text-align: right;">140</td>
    </tr>
    <tr>
      <td>Base64</td>
      <td style="text-align: right;"><strong>75%</strong></td>
      <td style="text-align: right;">38%</td>
      <td style="text-align: right;">19%</td>
      <td style="text-align: right;">210</td>
    </tr>
    <tr>
      <td>Base85 †</td>
      <td style="text-align: right;">80%</td>
      <td style="text-align: right;">40%</td>
      <td style="text-align: right;">20%</td>
      <td style="text-align: right;">224</td>
    </tr>
    <tr>
      <td rowspan="4">BMP&#x2011;constrained</td>
      <td><a href="https://github.com/ferno/hexagram-encode">HexagramEncode</a></td>
      <td style="text-align: right;">25%</td>
      <td style="text-align: right;">38%</td>
      <td style="text-align: right;">19%</td>
      <td style="text-align: right;">105</td>
    </tr>
    <tr>
      <td><a href="https://github.com/ferno/braille-encode">BrailleEncode</a></td>
      <td style="text-align: right;">33%</td>
      <td style="text-align: right;">50%</td>
      <td style="text-align: right;">25%</td>
      <td style="text-align: right;">140</td>
    </tr>
    <tr>
      <td><a href="https://github.com/qntm/base2048">Base2048</a></td>
      <td style="text-align: right;">56%</td>
      <td style="text-align: right;">69%</td>
      <td style="text-align: right;">34%</td>
      <td style="text-align: right;"><strong>385</strong></td>
    </tr>
    <tr>
      <td><a href="https://github.com/ferno/base32768">Base32768</a></td>
      <td style="text-align: right;">63%</td>
      <td style="text-align: right;"><strong>94%</strong></td>
      <td style="text-align: right;">47%</td>
      <td style="text-align: right;">263</td>
    </tr>
    <tr>
      <td rowspan="3">Full Unicode</td>
      <td><a href="https://github.com/keith-turner/ecoji">Ecoji</a></td>
      <td style="text-align: right;">31%</td>
      <td style="text-align: right;">31%</td>
      <td style="text-align: right;">31%</td>
      <td style="text-align: right;">175</td>
    </tr>
    <tr>
      <td><a href="https://github.com/ferno/base65536">Base65536</a></td>
      <td style="text-align: right;">56%</td>
      <td style="text-align: right;">64%</td>
      <td style="text-align: right;"><strong>50%</strong></td>
      <td style="text-align: right;">280</td>
    </tr>
    <tr>
      <td><a href="https://github.com/ferno/base131072">Base131072</a> ‡</td>
      <td style="text-align: right;">53%+</td>
      <td style="text-align: right;">53%+</td>
      <td style="text-align: right;">53%</td>
      <td style="text-align: right;">297</td>
    </tr>
  </tbody>
</table>

\* New-style "long" Tweets, up to 280 Unicode characters give or take Twitter's complex "weighting" calculation.<br/>
† Base85 is listed for completeness but all variants use characters which are considered hazardous for general use in text: escape characters, brackets, punctuation *etc.*.<br/>
‡ Base131072 is a work in progress, not yet ready for general use.<br/>

For example, using Base64, up to 105 bytes of binary data can fit in a Tweet. With Base131072, 297 bytes are possible.

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

and then encode as normal using our 2<sup>17</sup>-bit repertoire.

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

and then encode them using a completely different, 2<sup>9</sup>-character repertoire. On decoding, we will treat that character differently, returning 9 bits, rather than 17 from characters in the main repertoire.

#### Final 17-bit number has 16 missing bits

In this final case:

	c________________ // 16 missing bits

we simply take this as a 1-bit number:

	c

and encode it using a third, 2<sup>1</sup>-character repertoire. Again, on decoding, this is treated specially, and only 1 bit is added to the stream, rather than 9 or 17 as for the other characters.

In other words, Base131072 is a slight misnomer. It uses not 131,072 but 2<sup>17</sup> + 2<sup>9</sup> + 2<sup>1</sup> = 131,586 characters for its three repertoires. Of course, Base64 uses a 65th character for its padding too.

### Decoding

On decoding, we get a series of 8-bit values, the last of which might be incomplete, like so:

	1_______ // 7 missing bits
	11______ // 6 missing bits
	111_____ // 5 missing bits
	1111____ // 4 missing bits
	11111___ // 3 missing bits
	111111__ // 2 missing bits
	1111111_ // 1 missing bit

These are the padding 1s added at encoding time. We can check this and discard this final value.

## Is this ready yet?

No. We need 131,586 "safe" characters for this encoding, but as of Unicode 9.0 only 108,397 exist. However, future versions of Unicode may add enough safe characters for this to become possible. In any case, the groundwork can certainly be laid.
