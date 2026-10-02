import Link from "next/link";

import { ErrorScreen, primaryActionClass, secondaryActionClass } from "@/components/errors/error-screen";

export default function NotFound() {
  return (
    <ErrorScreen
      code="404"
      title="Page not found"
      description="The page you're looking for doesn't exist or has moved."
      actions={
        <>
          <Link href="/" className={primaryActionClass}>
            Go home
          </Link>
          <Link href="/dashboard" className={secondaryActionClass}>
            Open dashboard
          </Link>
        </>
      }
    />
  );
}
