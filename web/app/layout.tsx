import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SeaBackground } from "@/components/sea-background";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Squall: Structured yield on DeepBook Predict",
  description:
    "Tokenized ERC-4626 vaults on DeepBook Predict, powered by the first on-chain volatility index on Sui, with a verifiable track record on Walrus.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen">
        <SeaBackground />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
