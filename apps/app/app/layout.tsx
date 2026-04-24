import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { TRPCProvider } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { Chatbot } from "@/components/chatbot/ai-chatbot";

export const metadata: Metadata = {
  title: "Craftiv",
  description:
    "Create ATS-optimized, professionally designed resumes that land interviews. No credit card, no hidden fees—just free, forever.",
  icons: {
    icon: "/craftiv.png",
    shortcut: "/craftiv.png",
    apple: "/craftiv.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans")}>
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6660601826429035"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body
        className="antialiased font-sans"
        suppressHydrationWarning
      >
        <TRPCProvider>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              forcedTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              {children}
              <Chatbot />
              <Toaster richColors position="bottom-right" />
            </ThemeProvider>
          </AuthProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
