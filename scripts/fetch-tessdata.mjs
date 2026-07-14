#!/usr/bin/env node
// Downloads the bundled English Tesseract model from the npm registry (not
// jsDelivr) so `npm install` is enough to get a fully offline-capable OCR
// route — no CDN fetch at request time. Skips silently if already present.
import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import { extract } from "tar-stream";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const destDir = path.join(__dirname, "..", "tessdata");
const destFile = path.join(destDir, "eng.traineddata.gz");
const tarballUrl =
  "https://registry.npmjs.org/@tesseract.js-data/eng/-/eng-1.0.0.tgz";

if (existsSync(destFile)) {
  process.exit(0);
}

mkdirSync(destDir, { recursive: true });

const res = await fetch(tarballUrl);
if (!res.ok) {
  console.warn(
    `[fetch-tessdata] Could not download traineddata (${res.status}). ` +
      "OCR will fall back to fetching from jsDelivr at request time instead.",
  );
  process.exit(0);
}

// The tarball is a gzipped tar; extract just the one file we need.
const extractor = extract();
let found = false;

extractor.on("entry", (header, stream, next) => {
  if (header.name === "package/4.0.0_best_int/eng.traineddata.gz") {
    found = true;
    stream.pipe(createWriteStream(destFile)).on("finish", next);
  } else {
    stream.resume();
    stream.on("end", next);
  }
});

await pipeline(res.body, zlib.createGunzip(), extractor);

if (!found) {
  console.warn("[fetch-tessdata] Expected file not found in tarball.");
  process.exit(0);
}

console.log("[fetch-tessdata] Saved tessdata/eng.traineddata.gz");
