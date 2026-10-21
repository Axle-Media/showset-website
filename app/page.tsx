import {defaultPages,defaultGlobals} from '@/lib/data';
import SiteShell from '@/components/SiteShell';
export default function Home(){return <SiteShell initialPage={defaultPages.home} initialGlobals={defaultGlobals}/>}
