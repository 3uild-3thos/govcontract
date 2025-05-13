import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SPLGOV",
  description:
    "Check the latest proposal, see the live results and signal your opinion to the Solana Network.",
  openGraph: {
    title: "SPLGOV",
    description:
      "Check the latest proposal, see the live results and signal your opinion to the Solana Network.",
    type: "website",
    images: [
      {
        url: "/images/icons/realms.png",
        width: 1000,
        height: 1000,
        alt: "SPLGOV",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SPLGOV",
    description:
      "Check the latest proposal, see the live results and signal your opinion to the Solana Network.",
    images: ["/images/icons/realms.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
