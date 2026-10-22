import type { PageData } from "@/lib/types";
/** Shared authored metadata for static HTML and the original in-page route transition. */
export function conceptMetadata(page: PageData) {
  const label = page.seo.title || page.title;
  return {
    title: label.includes("SHOWSET") ? label : `${label} | SHOWSET`,
    description: page.seo.description || page.sections[0]?.body || "SHOWSET events and creative agency.",
  };
}
