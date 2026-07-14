import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <main className="flex w-full max-w-sm flex-col items-center gap-10 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-accent-foreground shadow-lg shadow-accent/20">
            SB
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">SplitBill</h1>
          <p className="text-balance text-base text-foreground/60">
            Scan a receipt, share a QR code, and let everyone tap what they
            ordered. No more doing the math.
          </p>
        </div>

        <Link
          href="/new"
          className="flex h-14 w-full items-center justify-center rounded-full bg-accent text-base font-medium text-accent-foreground shadow-lg shadow-accent/25 transition-transform active:scale-[0.98]"
        >
          Scan a Receipt
        </Link>

        <ol className="flex w-full flex-col gap-3 text-left text-sm text-foreground/60">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-xs font-semibold">
              1
            </span>
            Upload or photograph the receipt
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-xs font-semibold">
              2
            </span>
            Share the QR code with your table
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-xs font-semibold">
              3
            </span>
            Everyone taps what they ordered — done
          </li>
        </ol>
      </main>
    </div>
  );
}
