"use client";

import { useEffect } from "react";
import Link from "next/link";

import { ErrorScreen, primaryActionClass, secondaryActionClass } from "@/components/errors/error-screen";

export default function ErrorPage({
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
    <ErrorScreen
      code="Error"
      title="Something went wrong"
      description="An unexpected error stopped this page from loading. Your saved work is safe."
      actions={
        <>
          <button type="button" onClick={reset} className={primaryActionClass}>
            Try again
          </button>
          <Link href="/dashboard" className={secondaryActionClass}>
            Back to dashboard
          </Link>
        </>
      }
    />
  );
}
