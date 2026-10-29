import "server-only";
import { parseHTML } from "linkedom";
import type { ReactNode } from "react";
import { conceptDocument } from "@/lib/concept-12/document";
import { defaultGlobals, defaultPages } from "@/lib/data";
import LegalMobileMenu from "./LegalMobileMenu";

export type LegalSectionLink = { id: string; title: string };

type Props = {
  firstLine: string;
  accentLine: string;
  summary: string;
  sections: LegalSectionLink[];
  children: ReactNode;
};

/** Reuse the approved, bound SHOWSET header/footer without mounting scroll-driven page views. */
export default function LegalPageShell({ firstLine, accentLine, summary, sections, children }: Props) {
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
            <p className="legal-kicker">THE IMPORTANT DETAILS</p>
            <h1 className="legal-title">
              <span>{firstLine}<span className="legal-teal-dot">.</span></span>
              <span className="legal-title-accent">{accentLine}<span className="legal-white-dot">.</span></span>
            </h1>
            <p className="legal-summary">{summary}</p>
            <p className="legal-updated">Last updated: 29 October 2026</p>
          </div>
        </header>
        <div id="legal-content" className="legal-content">
          <aside className="legal-aside" aria-label="On this page">
            <p>ON THIS PAGE</p>
            <nav aria-label="Policy sections">
              {sections.map(({ id, title }) => <a key={id} href={`#${id}`}>{title}</a>)}
            </nav>
          </aside>
          <div className="legal-body">
            {children}
            <div className="legal-switch">
              <p>OTHER INFORMATION</p>
              <a href="/privacy-policy/">Privacy &amp; Policy <span aria-hidden="true">↗</span></a>
              <a href="/terms-and-conditions/">Terms &amp; Conditions <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </div>
      </main>
      <div dangerouslySetInnerHTML={{ __html: footer }} />
    </div>
  );
}
