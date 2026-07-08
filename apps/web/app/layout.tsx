import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: {
    default: "Doni Putra Purbawa — Senior Backend Engineer",
    template: "%s | Doni Putra Purbawa",
  },
  description:
    "Senior Backend Engineer specializing in fintech, cloud infrastructure, microservices, and AI-powered systems. Based in Indonesia, open to Japan opportunities.",
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
  authors: [{ name: "Doni Putra Purbawa" }],
  creator: "Doni Putra Purbawa",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://doniputrapurbawa.com",
    siteName: "Doni Putra Purbawa",
    title: "Doni Putra Purbawa — Senior Backend Engineer",
    description:
      "Senior Backend Engineer specializing in fintech, cloud infrastructure, microservices, and AI-powered systems.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Doni Putra Purbawa — Senior Backend Engineer",
    description:
      "Senior Backend Engineer specializing in fintech, cloud infrastructure, microservices, and AI-powered systems.",
  },
  robots: {
    index: true,
    follow: true,
  },
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
