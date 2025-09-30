import "./globals.css";
import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solana Validator Governance",
  description: "Vote and participate in Solana validator governance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${plusJakartaSans.variable} ${jetBrainsMono.variable} antialiased`}
      >
        <Navbar />
        <div className="w-full overflow-x-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">{children}</div>
        </div>
        <Footer />
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}
