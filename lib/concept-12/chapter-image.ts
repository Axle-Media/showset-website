import type { CaseStoryChapter } from "@/lib/types";
import { safeHref } from "@/lib/safe";

/** Read-time mapping only: never overwrite the retained legacy photo array. */
export function primaryChapterImage(chapter: CaseStoryChapter): string {
 const source=(value?:string)=>{
  const url=safeHref(value);
  // Local Studio originals are resolved to blob URLs only inside the protected
  // preview. Preserve their asset ID until the preview binds the actual photo.
  return value?.startsWith("asset:") ? value :
    (url.startsWith("/")||url.startsWith("https://")?url:"");
 };
 // An explicit empty primary field is intentional; don't resurrect older media.
 if(chapter.image!==undefined)return source(chapter.image);
 return (chapter.images||[]).map(source).find(Boolean)||"";
}
