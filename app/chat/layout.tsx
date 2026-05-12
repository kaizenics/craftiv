import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default function ChatLayout({ children }: { children: ReactNode }) {
  void children;
  redirect("/dashboard");
}
