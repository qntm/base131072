/** Base131072 is a binary-to-text encoding optimised for UTF-32 and Twitter. */

// Z is a number, usually a uint17 but sometimes a uint9 or a uint1

const BITS_PER_CHAR = 17 // This is a 17-bit encoding
const BITS_PER_BYTE = 8

// Compressed representation of inclusive-exclusive ranges of characters used
// in this encoding. TODO
const pairStrings = [
  '..................................',
  '.............',
  '..'
]

// Decompression
const lookupE = {}
const lookupD = {}
pairStrings.forEach((pairString, r) => {
  const numZBits = BITS_PER_CHAR - BITS_PER_BYTE * r // 0 -> 17, 1 -> 9, 2 -> 1
  lookupE[numZBits] = {}
  let z = 0
  pairString.match(/../gu).forEach(pair => {
    const [first, last] = [...pair].map(x => x.codePointAt(0))
    for (let codePoint = first; codePoint < last; codePoint++) {
      const chr = String.fromCodePoint(codePoint)
      lookupE[numZBits][z] = chr
      lookupD[chr] = [numZBits, z]
      z++
    }
  })
})

const encode = uint8Array => {
  const length = uint8Array.length

  let str = ''
  let z = 0
  let numZBits = 0

  for (let i = 0; i < length; i++) {
    const uint8 = uint8Array[i]

    // Take most significant bit first
    for (let j = BITS_PER_BYTE - 1; j >= 0; j--) {
      const bit = (uint8 >> j) & 1

      z = (z << 1) + bit
      numZBits++

      if (numZBits === BITS_PER_CHAR) {
        str += lookupE[numZBits][z]
        z = 0
        numZBits = 0
      }
    }
  }

  if (numZBits !== 0) {
    // Final bits require special treatment.
    while (!(numZBits in lookupE)) {
      z = (z << 1) + 1
      numZBits++
    }

    str += lookupE[numZBits][z]
  }

  return str
}

const decode = str => {
  const length = str.length

  // This length is a guess. There's a chance we allocate one more byte here
  // than we actually need. But we can count and slice it off later
  const uint8Array = new Uint8Array(Math.floor(length * BITS_PER_CHAR / BITS_PER_BYTE))
  let numUint8s = 0
  let uint8 = 0
  let numUint8Bits = 0
  let shouldBeNoMoreChars = false

  for (const chr of str) {
    if (shouldBeNoMoreChars) {
      throw new Error('Secondary character found before end of input')
    }

    if (!(chr in lookupD)) {
      throw new Error(`Unrecognised Base131072 character: ${chr}`)
    }

    const [numZBits, z] = lookupD[chr]

    // Take most significant bit first
    for (let j = numZBits - 1; j >= 0; j--) {
      const bit = (z >> j) & 1

      uint8 = (uint8 << 1) + bit
      numUint8Bits++

      if (numUint8Bits === BITS_PER_BYTE) {
        uint8Array[numUint8s] = uint8
        numUint8s++
        uint8 = 0
        numUint8Bits = 0
      }
    }

    if (numZBits !== BITS_PER_CHAR) {
      shouldBeNoMoreChars = true
    }
  }

  // Final padding bits! Requires special consideration!
  // Remember how we always pad with 1s?
  // Note: there could be 0 such bits, check still works though
  if (uint8 !== ((1 << numUint8Bits) - 1)) {
    throw new Error('Padding mismatch')
  }

  return new Uint8Array(uint8Array.buffer, 0, numUint8s)
}

export { encode, decode }
