import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { buildMetadata, siteConfig } from "@/lib/metadata";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  ...buildMetadata(),
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  keywords: [
    "Senior Backend Engineer",
    "Fintech Backend Engineer",
    "AWS Backend Engineer",
    "Backend Engineer Indonesia",
    "Backend Engineer Japan",
    "Payment Gateway Integration",
    "AI Backend Engineer",
    "LLM Integration",
  ],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.creator,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
