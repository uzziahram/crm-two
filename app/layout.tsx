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
  title: "Tech Forge",
  description: "Premier high-end tech hardware and component forge",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative">
        {/* Global subtle background grid - defines the paper-like base */}
        <div className="fixed inset-0 bg-[grid_rgba(0,0,0,0.01)_30px_30px] dark:bg-[grid_rgba(255,255,255,0.005)_30px_30px] pointer-events-none -z-10" />
        {children}
      </body>
    </html>
  );
}
