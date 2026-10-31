// Prints "HEX<TAB>NAME" for every emoji scalar, for scripts/build-emoji-catalog.mjs.
for value in UInt32(0x80)...UInt32(0x10FFFF) {
  guard let scalar = Unicode.Scalar(value), scalar.properties.isEmoji, let name = scalar.properties.name else { continue }
  print(String(value, radix: 16) + "\t" + name)
}
