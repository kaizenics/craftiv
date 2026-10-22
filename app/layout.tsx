import type { Metadata, Viewport } from "next";
import { Manrope, Lora, Figtree } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { TRPCProvider } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { siteConfig } from "@/lib/seo";
import { ChatbotLoader } from "@/components/chatbot/chatbot-loader";

const loraHeading = Lora({subsets:['latin'],variable:'--font-heading'});

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "career tools",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/craftiv.png",
    shortcut: "/craftiv.png",
    apple: "/craftiv.png",
  },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: "/",
    siteName: siteConfig.name,
    // Social card image is provided by app/opengraph-image.tsx (1200x630).
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    // Card image is provided by app/twitter-image.tsx (1200x630).
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#3159e7",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", figtree.variable, loraHeading.variable)}>
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6660601826429035"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body
        className={`${manrope.variable} ${lora.variable} antialiased font-sans`}
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
              <ChatbotLoader />
              <Toaster richColors position="bottom-right" />
            </ThemeProvider>
          </AuthProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
