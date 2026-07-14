"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QRCodeDisplay({ url }: { url: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, { margin: 1, width: 240 }).then((generated) => {
      if (!cancelled) setDataUrl(generated);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!dataUrl) {
    return <div className="h-60 w-60 animate-pulse rounded-2xl bg-foreground/10" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt="QR code to join this bill"
      className="h-60 w-60 rounded-2xl border border-foreground/10 bg-white p-3"
    />
  );
}
