"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase/client";

export async function uploadReceiptImage(sessionId: string, file: File): Promise<string> {
  const storage = getFirebaseStorage();
  const fileRef = ref(storage, `receipts/${sessionId}/${Date.now()}-${file.name}`);
  await uploadBytes(fileRef, file, { contentType: file.type });
  return getDownloadURL(fileRef);
}
