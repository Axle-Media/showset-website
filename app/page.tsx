import { conceptMetadata } from "@/lib/concept-12/metadata";
import type { Metadata } from 'next';
import { defaultPages, defaultGlobals } from '@/lib/data';
import SiteShell from '@/components/SiteShell';

export const metadata: Metadata = conceptMetadata(defaultPages.home);

export default function Home() {
  return <SiteShell initialPage={defaultPages.home} initialGlobals={defaultGlobals} />;
}
