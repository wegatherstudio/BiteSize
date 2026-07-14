"use client";

import { useRef, useState } from "react";

interface ReceiptUploaderProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function ReceiptUploader({ onFileSelected, disabled }: ReceiptUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    onFileSelected(file);
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Receipt preview"
          className="max-h-72 w-full rounded-2xl border border-foreground/10 object-contain"
        />
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="flex h-56 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-foreground/15 text-foreground/50 transition-colors active:bg-foreground/5 disabled:opacity-50"
        >
          <span className="text-3xl">📷</span>
          <span className="text-sm font-medium">Tap to take a photo or upload</span>
        </button>
      )}

      {previewUrl && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="text-sm font-medium text-accent underline-offset-4 hover:underline disabled:opacity-50"
        >
          Choose a different photo
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  );
}
