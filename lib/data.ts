import pagesSeed from '@/content/pages.json';
import globalsSeed from '@/content/globals.json';
import type {PageData,Globals,Block} from './types';
export const defaultPages:Record<string,PageData>=pagesSeed as Record<string,PageData>;
export const defaultGlobals:Globals=globalsSeed as Globals;
export const pageList=Object.values(defaultPages).map(p=>({slug:p.slug,route:p.route,title:p.title}));
export function slugToPage(parts:string[]|undefined):PageData|undefined {
 const route='/'+(parts||[]).join('/')+((parts||[]).length?'/':'');
 return Object.values(defaultPages).find(p=>p.route===route);
}
export function newBlock(type:Block['type']):Block {return {design:{},id:'section-'+Math.random().toString(36).slice(2,9),type,headline:'Your next big idea.',accent:'Starts here.',body:'Edit this section to tell your story.',image:'/media/planning.webp',pattern:false,reveal:true,buttonLabel:'Get in touch',buttonHref:'/contact/',secondaryLabel:'',secondaryHref:'',items:[],speed:6,formTitle:'Tell us about it.',helperText:''}}
export const apiEndpoint='/api/showset/index.php';
