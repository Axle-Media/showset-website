import "server-only";
import { parseHTML } from "linkedom";
import type { ReactNode } from "react";
import { conceptDocument } from "@/lib/concept-12/document";
import { defaultGlobals, defaultPages } from "@/lib/data";
import LegalMobileMenu from "./LegalMobileMenu";

type Props = {
  firstLine: string;
  accentLine: string;
  summary: string;
  compactTitle?: boolean;
  children: ReactNode;
};

/** Reuse the approved, bound SHOWSET header/footer without mounting scroll-driven page views. */
export default function LegalPageShell({ firstLine, accentLine, summary, compactTitle = false, children }: Props) {
  const { document } = parseHTML("<!doctype html><html><body><div id='legal-source'></div></body></html>");
  const source = document.getElementById("legal-source")!;
  source.innerHTML = conceptDocument(defaultPages.home, defaultGlobals);
  const header = source.querySelector(".site-header")?.outerHTML || "";
  const mobile = source.querySelector(".mobile-panel")?.outerHTML || "";
  const footer = source.querySelector(".footer")?.outerHTML || "";

  return (
    <div className="concept-12-root legal-page">
      <a className="skip-link" href="#legal-content">Skip to content</a>
      <div dangerouslySetInnerHTML={{ __html: header + mobile }} />
      <LegalMobileMenu />
      <main id="main" className="legal-main">
        <header className="legal-hero">
          <div className="legal-hero-inner">
            <h1 className={compactTitle ? "legal-title legal-title--one-line" : "legal-title"}>
              {compactTitle ? (
                <span>{firstLine}{" "}<span className="legal-title-accent">{accentLine}<span className="legal-white-dot">.</span></span></span>
              ) : (
                <>
                  <span>{firstLine}<span className="legal-teal-dot">.</span></span>
                  <span className="legal-title-accent">{accentLine}<span className="legal-white-dot">.</span></span>
                </>
              )}
            </h1>
            <p className="legal-summary">{summary}</p>
            <p className="legal-updated">Last updated: 29 October 2026</p>
          </div>
        </header>
        <div id="legal-content" className="legal-content">
          <div className="legal-body">
            {children}
          </div>
        </div>
      </main>
      <div dangerouslySetInnerHTML={{ __html: footer }} />
    </div>
  );
}
