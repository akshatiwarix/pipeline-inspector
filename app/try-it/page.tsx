import Link from "next/link";
import { TryItForm } from "@/app/components/try-it-form";

export default function TryItPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/" className="text-sm underline decoration-line-strong underline-offset-4 hover:decoration-ink">
        ← Back to Pipeline Library
      </Link>
      <header className="mt-4 max-w-3xl">
        <h1 className="font-display text-3xl italic text-ink sm:text-4xl">Try It Yourself</h1>
        <p className="mt-2 text-ink-dim">
          Paste or edit an opportunity in the format below and watch the same deterministic inspector
          used across the Pipeline Library run live in your browser, evaluated against today&apos;s
          real date rather than a fixed snapshot.
        </p>
      </header>
      <div className="mt-8">
        <TryItForm />
      </div>
    </main>
  );
}
