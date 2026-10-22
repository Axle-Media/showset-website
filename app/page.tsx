import type { Metadata } from 'next';
import { defaultPages, defaultGlobals } from '@/lib/data';
import SiteShell from '@/components/SiteShell';

export const metadata: Metadata = {
  title: defaultPages.home.seo.title,
  description: defaultPages.home.seo.description,
};

export default function Home() {
  return <SiteShell initialPage={defaultPages.home} initialGlobals={defaultGlobals} />;
}
