import type { Metadata, Viewport } from "next";
import "./fonts.css";
import "./concept-12.css";
import "./concept-12-refinements.css";
import "./concept-12-editor.css";
export const metadata: Metadata = {
  title: "SHOWSET | Events & Creative Agency",
  description:
    "Events, creative design, digital experiences and production in one connected agency. We think, design, plan and make ideas happen.",
  robots: process.env.SHOWSET_STATIC_STAGING === "true"
    ? { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } }
    : { index: true, follow: true },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
