import type { CaseStoryChapter } from "@/lib/types";
import { safeHref } from "@/lib/safe";

/** Read-time mapping only: never overwrite the retained legacy photo array. */
export function primaryChapterImage(chapter: CaseStoryChapter): string {
 const source=(value?:string)=>{
  const url=safeHref(value);
  return url.startsWith("/")||url.startsWith("https://")?url:"";
 };
 // An explicit empty primary field is intentional; don't resurrect older media.
 if(chapter.image!==undefined)return source(chapter.image);
 return (chapter.images||[]).map(source).find(Boolean)||"";
}
