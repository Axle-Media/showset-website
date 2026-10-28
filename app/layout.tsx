import type { Metadata, Viewport } from "next";
import "./fonts.css";
import "./concept-12.css";
import "./concept-12-refinements.css";
import "./case-study.css";
import "./concept-12-editor.css";
import "./concept-12-accessibility.css";
import "./site-typography.css";
import "./editorial-columns.css";
import "./service-experience.css";
import "./headline-entrance-policy.css";
import "./editorial-experiences.css";
import "./agency-pages.css";
import "./studio-scroll-story.css";
import "./closing-cta.css";
import "./work-gallery.css";
import "./contact-compact.css";
export const metadata: Metadata = {
  title: "SHOWSET | Events & Creative Agency",
  description:
    "Events, creative design, digital experiences and production in one connected agency. We think, design, plan and make ideas happen.",
  robots: { index: true, follow: true },
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

      <body>
        <noscript><style>{`.soft-rise{opacity:1!important;transform:none!important}.wipe-line>span{clip-path:none!important;opacity:1!important;animation:none!important}.wipe-line:after{display:none!important}.hero-foreground{opacity:1!important;translate:none}.hero-second{display:none!important}.hero-nojs-scene{position:relative;padding:60px var(--gutter)}.film-track,.film-stage{height:auto;min-height:0}.film-stage{position:relative;padding:100px 0}.film-story-inner{position:relative;inset:auto;padding:0 var(--gutter)}.film-steps{min-height:0}.film-step{position:relative;inset:auto;opacity:1;transform:none;margin-bottom:50px}.dot-core{clip-path:circle(150vmax at 50% 50%)!important}.dot-words{opacity:1!important;transform:none!important}.case-rail{transform:none!important}`}</style></noscript>
        {children}
      </body>
    </html>
  );
}
