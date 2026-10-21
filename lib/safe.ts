export function safeHref(value?:string):string {
 if(!value)return '#';
 const s=value.trim();
 if(s.startsWith('/')&&!s.startsWith('//'))return s;
 if(s.startsWith('#'))return s;
 if(/^mailto:[^\s<>]+$/i.test(s))return s;
 if(/^https:\/\/[a-z0-9]/i.test(s))return s;
 return '#';
}
export function cleanText(value:string):string {return String(value||'').replace(/<\/?p[^>]*>/g,'\n\n').replace(/<[^>]*>/g,'').trim();}
export function lines(value:string):string[]{return cleanText(value).split(/\n\s*\n/).filter(Boolean)}
