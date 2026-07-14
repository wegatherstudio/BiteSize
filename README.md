# SplitBill

Scan a receipt, share a QR code, and let everyone tap what they ordered.
Next.js (App Router) + Firebase (Firestore, Storage, Anonymous Auth) +
Tesseract.js for OCR.

## Setup

1. `npm install`
2. Create a Firebase project, enable **Firestore**, **Storage**, and
   **Authentication → Anonymous** sign-in.
3. Copy `.env.local.example` to `.env.local` and fill in your Firebase web
   app config (Project Settings → General → Your apps).
4. Deploy the security rules: `firebase deploy --only firestore:rules,storage:rules`
   (requires the [Firebase CLI](https://firebase.google.com/docs/cli), `firebase login`,
   and `firebase use <project-id>` first).
5. `npm run dev` and open http://localhost:3000.

`npm install` fetches the English OCR model into `tessdata/` via a
postinstall script (from the npm registry, not jsDelivr), so receipt
scanning works without any external CDN dependency at request time.

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run test` — unit tests (`lib/split/calculateSplit.ts` split-math logic)
- `npm run lint` — ESLint

## Known MVP limitations

- Split totals are computed client-side from data every session member can
  already read (items/participants are open for the live-claiming UX to
  work). The payer-only "full total" view is a UI convention, not a hard
  security boundary — a v2 could move the calculation into a Cloud Function
  with tighter read rules if that matters for your use case.
- No session expiry/cleanup job yet (see plan's edge cases section) —
  sessions accumulate in Firestore/Storage indefinitely.
