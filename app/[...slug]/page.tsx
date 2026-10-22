import { conceptDocument } from "@/lib/concept-12/document";
import { conceptMetadata } from "@/lib/concept-12/metadata";
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { slugToPage, defaultGlobals, pageList } from '@/lib/data';
import SiteShell from '@/components/SiteShell';

export const dynamicParams = false;

export function generateStaticParams() {
  return pageList.filter((p) => p.slug !== 'home').map((p) => ({ slug: p.route.split('/').filter(Boolean) }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const page = slugToPage((await params).slug);
  if (!page) notFound();
  return conceptMetadata(page);
}

export default async function ContentPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const page = slugToPage((await params).slug);
  if (!page) notFound();
  return <SiteShell initialMarkup={conceptDocument(page, defaultGlobals)} initialPage={page} initialGlobals={defaultGlobals} />;
}
