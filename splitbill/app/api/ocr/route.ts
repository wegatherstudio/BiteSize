import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { createWorker, type Worker } from "tesseract.js";
import { preprocessReceiptImage } from "@/lib/ocr/preprocessImage";
import { parseReceiptText, type OcrLine } from "@/lib/ocr/parseReceiptText";

export const runtime = "nodejs";
export const maxDuration = 60;

// English traineddata is bundled locally (tessdata/eng.traineddata.gz) so OCR
// never depends on jsDelivr being reachable at request time — no cold-start
// CDN fetch, and it keeps working if that CDN is slow, blocked, or down.
const TESSDATA_PATH = path.join(process.cwd(), "tessdata");

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing image file." }, { status: 400 });
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());

  let processedBuffer: Buffer;
  try {
    processedBuffer = await preprocessReceiptImage(inputBuffer);
  } catch {
    return NextResponse.json({ error: "Could not read that image." }, { status: 400 });
  }

  let worker: Worker | null = null;
  try {
    worker = await createWorker("eng", undefined, { langPath: TESSDATA_PATH, cacheMethod: "none" });
    const { data } = await worker.recognize(
      processedBuffer,
      {},
      { blocks: true, text: true },
    );

    const ocrLines: OcrLine[] = [];
    for (const block of data.blocks ?? []) {
      for (const paragraph of block.paragraphs) {
        for (const line of paragraph.lines) {
          ocrLines.push({ text: line.text, confidence: line.confidence });
        }
      }
    }

    const parsed = parseReceiptText(ocrLines);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("OCR failed:", error);
    return NextResponse.json(
      { error: "OCR failed. Try entering items manually." },
      { status: 500 },
    );
  } finally {
    await worker?.terminate();
  }
}
