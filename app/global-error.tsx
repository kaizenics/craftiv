"use client";

import { useEffect } from "react";

import "./globals.css";
import { ErrorScreen, primaryActionClass } from "@/components/errors/error-screen";

/** Replaces the root layout when the layout itself fails, so it renders its own <html>. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorScreen
          code="Error"
          title="Something went wrong"
          description="Craftiv hit an unexpected error. Please try again."
          actions={
            <button type="button" onClick={reset} className={primaryActionClass}>
              Try again
            </button>
          }
        />
      </body>
    </html>
  );
}
