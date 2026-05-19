import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Cortex — AI Research Paper Analyzer",
  description:
    "Upload research papers and ask questions with full retrieval transparency. See exactly how the AI finds its answers through vector search, re-ranking, and context visualization.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-canvas text-primary antialiased font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
