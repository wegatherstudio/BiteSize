import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // tesseract.js and sharp both do their own dynamic requires/native
  // bindings under the hood that break if Next tries to bundle them.
  serverExternalPackages: ["tesseract.js", "sharp"],
  // The bundled English traineddata isn't a JS import, so trace it in
  // explicitly or the deployed function won't have it on disk.
  outputFileTracingIncludes: {
    "/api/ocr": ["./tessdata/**/*"],
  },
};

export default nextConfig;
