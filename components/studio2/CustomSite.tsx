"use client";
import { useLayoutEffect, useRef } from "react";
import type { PageData, Globals } from "@/lib/types";
import { composeCustom } from "@/lib/studio2/compose";
import { nodeMotions } from "@/lib/studio2/render";
import { mountNodeMotion } from "@/lib/studio2/motion";
import morphdom from "morphdom";
export default function CustomSite({
  page,
  g,
  catalog,
  initialMarkup,
  editor = false,
  urls = {},
}: {
  page: PageData;
  g: Globals;
  catalog: Record<string, PageData>;
  initialMarkup?: string;
  editor?: boolean;
  urls?: Record<string, string>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const host = ref.current;
    if (!host) return;
    const target = host.ownerDocument.createElement("div");
    composeCustom(target, page, g, catalog, urls);
    morphdom(host, target, {
      childrenOnly: true,
      onBeforeElUpdated(from, to) {
        if (
          from.hasAttribute("data-builder-motion") &&
          from.getAttribute("data-builder-motion-config") ===
            to.getAttribute("data-builder-motion-config")
        ) {
          for (const key of [
            "transform",
            "opacity",
            "clip-path",
            "transition",
          ]) {
            const v = (from as HTMLElement).style.getPropertyValue(key);
            if (v) (to as HTMLElement).style.setProperty(key, v);
          }
          if (from.hasAttribute("data-builder-seen"))
            to.setAttribute("data-builder-seen", "true");
        }
        if (from.matches("details"))
          to.toggleAttribute("open", from.hasAttribute("open"));
        return !from.isEqualNode(to);
      },
    });
    const dispose = mountNodeMotion(
      host,
      nodeMotions(page),
      !editor && g.motion.enabled,
    );
    const toggle=host.querySelector<HTMLButtonElement>('#mobile-toggle'),panel=host.querySelector<HTMLElement>('#mobile-panel'),header=host.querySelector('#site-header');
    const setMenu=(open:boolean)=>{toggle?.setAttribute('aria-expanded',String(open));toggle?.setAttribute('aria-label',open?'Close menu':'Open menu');panel?.classList.toggle('open',open);panel?.setAttribute('aria-hidden',String(!open));panel?.toggleAttribute('inert',!open);header?.classList.toggle('menu-is-open',open);document.body.classList.toggle('menu-open',open)};
    setMenu(false);
    const click=()=>setMenu(toggle?.getAttribute('aria-expanded')!=='true');
    const key=(e:KeyboardEvent)=>{if(!panel?.classList.contains('open'))return;if(e.key==='Escape'){setMenu(false);toggle?.focus();e.preventDefault()}if(e.key==='Tab'){const stops=[toggle,...panel.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')].filter(Boolean)as HTMLElement[],index=stops.indexOf(document.activeElement as HTMLElement);if(index<0||e.shiftKey&&index===0||!e.shiftKey&&index===stops.length-1){e.preventDefault();stops[e.shiftKey?stops.length-1:0]?.focus()}}};
    const route=()=>setMenu(false);
    toggle?.addEventListener('click',click);panel?.addEventListener('click',route);window.addEventListener('keydown',key);
    return()=>{dispose();setMenu(false);toggle?.removeEventListener('click',click);panel?.removeEventListener('click',route);window.removeEventListener('keydown',key)};
  }, [page, g, catalog, editor, urls]);
  return (
    <div
      ref={ref}
      className="concept-12-root s2-site"
      dangerouslySetInnerHTML={{ __html: initialMarkup || "" }}
    />
  );
}
