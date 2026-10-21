import { notFound } from 'next/navigation';
import type {Metadata} from 'next';
import {slugToPage,defaultGlobals,pageList} from '@/lib/data';
import SiteShell from '@/components/SiteShell';
export const dynamicParams=false;
export function generateStaticParams(){return pageList.filter(p=>p.slug!=='home').map(p=>({slug:p.route.split('/').filter(Boolean)}));}
export async function generateMetadata({params}:{params:Promise<{slug:string[]}>}):Promise<Metadata>{const p=slugToPage((await params).slug);return {title:p?.seo?.title||p?.title||'SHOWSET',description:p?.seo?.description||"Ideas shouldn't sit still."}}
export default async function ContentPage({params}:{params:Promise<{slug:string[]}>}){const p=slugToPage((await params).slug);if(!p)notFound();return <SiteShell initialPage={p} initialGlobals={defaultGlobals}/>}
