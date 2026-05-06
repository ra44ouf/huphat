import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["latin", "arabic"],
});

export const metadata: Metadata = {
  title: "منصة شبهات | إلى النور باليقين",
  description: "منصة إسلامية علمية للرد على الشبهات وتفنيدها - إلى النور باليقين",
  icons: {
    icon: [
      { url: "/logo.jpg?v=1" },
      { url: "/icon.jpg?v=1" },
    ],
    apple: "/logo.jpg?v=1",
  }
};

import { MobileNav } from "@/components/mobile-nav";
import { SplashScreen } from "@/components/splash-screen";
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans pb-28 md:pb-0 relative">
        <SplashScreen />
        <Providers>
          {children}
          <MobileNav />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
