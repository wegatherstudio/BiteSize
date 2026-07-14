import sharp from "sharp";

/**
 * Cheap, generic preprocessing to help Tesseract on typical phone photos of
 * receipts: fix EXIF rotation, flatten to grayscale, stretch contrast, and
 * make sure resolution is high enough for small thermal-print text.
 */
export async function preprocessReceiptImage(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .grayscale()
    .normalize()
    .sharpen()
    .resize({ width: 1800, fit: "inside" })
    .toFormat("png")
    .toBuffer();
}
