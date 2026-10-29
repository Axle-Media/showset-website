/** Read dimensions before allocating a decoded bitmap. No executable upload types. */
export function imageDimensions(
  bytes: Uint8Array,
  type: string,
): { width: number; height: number } {
  const u16 = (i: number) => (bytes[i] << 8) | bytes[i + 1],
    le16 = (i: number) => bytes[i] | (bytes[i + 1] << 8),
    le24 = (i: number) => le16(i) | (bytes[i + 2] << 16);
  let width = 0,
    height = 0;
  if (
    type === "image/png" &&
    bytes.length >= 24 &&
    String.fromCharCode(...bytes.slice(12, 16)) === "IHDR"
  ) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    width = view.getUint32(16);
    height = view.getUint32(20);
  }
  if (type === "image/jpeg") {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 255) break;
      while (bytes[offset + 1] === 255) offset++;
      const marker = bytes[offset + 1],
        length = u16(offset + 2);
      if (
        [
          192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207,
        ].includes(marker)
      ) {
        height = u16(offset + 5);
        width = u16(offset + 7);
        break;
      }
      if (length < 2) break;
      offset += length + 2;
    }
  }
  if (type === "image/webp" && bytes.length >= 25) {
    const chunk = String.fromCharCode(...bytes.slice(12, 16));
    if (chunk === "VP8X" && bytes.length >= 30) {
      width = 1 + le24(24);
      height = 1 + le24(27);
    } else if (
      chunk === "VP8 " &&
      bytes.length >= 30 &&
      bytes[23] === 157 &&
      bytes[24] === 1 &&
      bytes[25] === 42
    ) {
      width = le16(26) & 16383;
      height = le16(28) & 16383;
    } else if (chunk === "VP8L" && bytes[20] === 47) {
      width = 1 + (bytes[21] | ((bytes[22] & 63) << 8));
      height =
        1 + ((bytes[22] >> 6) | (bytes[23] << 2) | ((bytes[24] & 15) << 10));
    }
  }
  if (
    !width ||
    !height ||
    width > 8192 ||
    height > 8192 ||
    width * height > 24000000
  )
    throw Error(
      "Invalid image dimensions or image exceeds 24 megapixels / 8192 px.",
    );
  return { width, height };
}
