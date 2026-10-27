"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/** Sonner, following the site theme so toasts are dark in dark mode. */
export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();
  return <Sonner theme={resolvedTheme === "dark" ? "dark" : "light"} {...props} />;
}
