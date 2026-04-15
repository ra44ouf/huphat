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
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
