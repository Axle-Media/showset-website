import type { Metadata, Viewport } from "next";
import "./fonts.css";
import "./globals.css";
import "./experience-three.css";
import "./motion-prototype.css";
export const metadata: Metadata = {
  title: "SHOWSET | Events & Creative Agency",
  description:
    "We bring events, creative design, digital experiences and production into one connected agency.",
  robots: { index: true, follow: true },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0D2F49",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB">
      <head>
        <link
          rel="preload"
          href="/fonts/showset-0.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/showset-4.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>

      <body>{children}</body>
    </html>
  );
}
