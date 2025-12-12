import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "Zero-Touch | God-View Dashboard",
  description: "Universal Self-Adaptive Autonomous Business Ecosystem - Monitor your money stream in real-time",
  keywords: ["automation", "business", "AI", "leads", "sales"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
