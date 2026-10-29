"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Workspace } from "@/lib/studio2/model";
import { findNode, isLoopback } from "@/lib/studio2/model";
import { SiteLayout } from "@/components/ConceptSite";
import CustomSite from "./CustomSite";
import {
  applyTemplateOverrides,
  templateBindings,
  bindingContent,
} from "@/lib/studio2/bindings";
import { readStore, mediaUrls } from "@/lib/studio2/storage";
export interface CanvasState {
  workspace: Workspace;
  slug: string;
  selected: string | null;
  interactive: boolean;
  urls: Record<string, string>;
}
export default function Preview() {
  const [state, setState] = useState<CanvasState | null>(null),
    [unavailable, setUnavailable] = useState(false);
  const host = useRef<HTMLDivElement>(null),
    current = useRef(state),
    lastSelected = useRef<string | null>(null);
  current.current = state;
  useEffect(() => {
    if (!isLoopback(location.hostname)) {
      setUnavailable(true);
      return;
    }
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== location.origin ||
        event.source !== parent ||
        parent === window ||
        event.data?.type !== "showset-studio2-state"
      )
        return;
      const data = event.data.state as CanvasState;
      if (
        data?.workspace?.schemaVersion === 2 &&
        data.workspace.pages[data.slug]
      )
        setState(data);
    };
    addEventListener("message", receive);
    if (parent !== window)
      parent.postMessage({ type: "showset-studio2-ready" }, location.origin);
    else {
      readStore<Workspace>("documents", "preview").then(async (workspace) => {
        if (!workspace) return;
        const slug = new URLSearchParams(location.search).get("page") || "home";
        setState({
          workspace,
          slug: workspace.pages[slug] ? slug : "home",
          selected: null,
          interactive: true,
          urls: await mediaUrls(workspace.media),
        });
      });
    }
    const back=()=>{const slug=new URLSearchParams(location.search).get('page')||'home';setState(value=>value?.workspace.pages[slug]?{...value,slug}:value)};addEventListener('popstate',back);return()=>{removeEventListener('message',receive);removeEventListener('popstate',back)};
  }, []);
  useEffect(()=>{if(!state)return;const page=state.workspace.pages[state.slug];document.title=page.seo.title||page.title;let meta=document.querySelector<HTMLMetaElement>('meta[name="description"]');if(!meta){meta=document.createElement('meta');meta.name='description';document.head.append(meta)}meta.content=page.seo.description||''},[state?.workspace.pages,state?.slug]);
  useLayoutEffect(() => {
    const root = host.current;
    if (!root || !state) return;
    const page = state.workspace.pages[state.slug];
    if (page.builder?.mode !== "custom")
      applyTemplateOverrides(root, page, true, state.urls);
    root
      .querySelectorAll("[data-builder-node]")
      .forEach((el) =>
        el.classList.toggle(
          "s2-selected",
          el.getAttribute("data-builder-node") === state.selected,
        ),
      );
    if (state.selected && state.selected !== lastSelected.current) {
      const el = [
        ...root.querySelectorAll<HTMLElement>("[data-builder-node]"),
      ].find((el) => el.dataset.builderNode === state.selected);
      el?.scrollIntoView({ block: "center", behavior: "instant" });
    }
    lastSelected.current = state.selected;
    if (state.selected && parent !== window) {
      const target = [
        ...root.querySelectorAll<HTMLElement>("[data-builder-node]"),
      ].find((el) => el.dataset.builderNode === state.selected);
      if (target) {
        const binding = templateBindings(page).find(
            (b) => b.id === state.selected,
          ),
          node = findNode(page.builder?.roots || [], state.selected),
          computed = getComputedStyle(target);
        const value: Record<string, string> = {
          content: binding
            ? bindingContent(page, binding)
            : node?.props.text || "",
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          fontFamily: computed.fontFamily.includes("Manrope")
            ? "Manrope"
            : "Poppins",
          lineHeight: String(
            Math.round(
              (parseFloat(computed.lineHeight) /
                parseFloat(computed.fontSize)) *
                1000,
            ) / 1000,
          ),
          letterSpacing: computed.letterSpacing,
          color: computed.color,
          href: target.getAttribute("href") || "",
          src:
            binding?.kind === "image"
              ? bindingContent(page, binding)
              : node?.props.src || "",
          alt: target.getAttribute("alt") || "",
        };
        parent.postMessage(
          { type: "showset-studio2-metrics", value },
          location.origin,
        );
      }
    }
  }, [state]);
  useEffect(() => {
    const root = host.current;
    if (!root) return;
    let editing: HTMLElement | null = null,
      cancel = false,
      originalHtml = "";
    const send = (type: string, payload: Record<string, unknown>) => {
      if (parent !== window)
        parent.postMessage({ type, ...payload }, location.origin);
    };
    const choose = (event: MouseEvent) => {
      if (current.current?.interactive) return;
      const target = (event.target as Element).closest<HTMLElement>(
        "[data-builder-node]",
      );
      if (!target) {const link=(event.target as Element).closest<HTMLAnchorElement>('a[href]');if(link){event.preventDefault();event.stopImmediatePropagation();const url=new URL(link.href,location.href);if(url.origin===location.origin&&!url.hash)send('showset-studio2-navigate',{route:url.pathname})}return;}
      event.preventDefault();
      event.stopImmediatePropagation();
      send("showset-studio2-select", { id: target.dataset.builderNode });
    };
    const edit = (event: MouseEvent) => {
      const data = current.current;
      if (!data || data.interactive) return;
      const target = (event.target as Element).closest<HTMLElement>(
        "[data-builder-node]",
      );
      if (!target) return;
      const page = data.workspace.pages[data.slug],
        id = target.dataset.builderNode!;
      const binding = templateBindings(page).find((b) => b.id === id),
        node = findNode(page.builder?.roots || [], id);
      if (node?.locked) return;
      if (
        (binding && !["heading", "text", "button"].includes(binding.kind)) ||
        (node && !["heading", "text", "button"].includes(node.kind))
      )
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
      editing =
        binding?.field === "headline"
          ? target.querySelector<HTMLElement>(
              ".line>span,.wipe-line>span,.plain-line",
            ) || target
          : target;
      cancel = false;
      originalHtml = editing.innerHTML;
      editing.textContent = binding
        ? bindingContent(page, binding)
        : node?.props.text || "";
      editing.contentEditable = "true";
      editing.dataset.inlineEditing = id;
      editing.setAttribute("role", "textbox");
      editing.setAttribute("aria-label", "Inline text editor");
      editing.focus();
      const range = document.createRange();
      range.selectNodeContents(editing);
      getSelection()?.removeAllRanges();
      getSelection()?.addRange(range);
    };
    const blur = (event: FocusEvent) => {
      const element = event.target as HTMLElement;
      if (element !== editing || !editing) return;
      const id = editing.dataset.inlineEditing!,
        text = editing.innerText;
      editing.removeAttribute("contenteditable");
      editing.removeAttribute("data-inline-editing");
      editing.removeAttribute("role");
      editing.removeAttribute("aria-label");
      if (cancel) editing.innerHTML = originalHtml;
      editing = null;
      send("showset-studio2-inline", { id, text, cancel });
    };
    const key = (event: KeyboardEvent) => {
      if (editing && event.key === "Escape") {
        cancel = true;
        editing.blur();
      }
      if (editing && event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        editing.blur();
      }
    };
    const links = (event: MouseEvent) => {
      if (!current.current?.interactive) return;
      const link = (event.target as Element).closest<HTMLAnchorElement>(
        "a[href]",
      );
      if (!link) return;
      const url = new URL(link.href, location.href);
      if(url.origin===location.origin&&!url.hash){const data=current.current,next=Object.values(data!.workspace.pages).find(p=>p.route===url.pathname);event.preventDefault();event.stopImmediatePropagation();if(parent!==window)send('showset-studio2-navigate',{route:url.pathname});else if(next){setState(previous=>previous?{...previous,slug:next.slug}:null);history.pushState({},'', '/studio/next/preview/?page='+encodeURIComponent(next.slug));scrollTo(0,0)}}
    };
    root.addEventListener("click", choose, true);
    root.addEventListener("dblclick", edit, true);
    root.addEventListener("focusout", blur, true);
    root.addEventListener("keydown", key, true);
    root.addEventListener("click", links, true);
    return () => {
      root.removeEventListener("click", choose, true);
      root.removeEventListener("dblclick", edit, true);
      root.removeEventListener("focusout", blur, true);
      root.removeEventListener("keydown", key, true);
      root.removeEventListener("click", links, true);
    };
  }, [!!state]);
  if (unavailable)
    return (
      <main className="s2-preview-notice">
        <h1>Private editing workspace</h1>
        <p>
          Studio 2.0 is available on localhost only until authenticated hosting
          is configured.
        </p>
      </main>
    );
  if (!state)
    return (
      <main className="s2-preview-notice">
        <h1>Local preview</h1>
        <p>Open Studio 2.0 and save a local preview to view it here.</p>
      </main>
    );
  const page = state.workspace.pages[state.slug];
  return (
    <div ref={host} className={!state.interactive ? "s2-edit-canvas" : ""}>
      {page.builder?.mode === "custom" ? (
        <CustomSite
          page={page}
          g={state.workspace.globals}
          catalog={state.workspace.pages}
          editor={!state.interactive}
          urls={state.urls}
        />
      ) : (
        <SiteLayout
          page={page}
          g={state.workspace.globals}
          catalog={state.workspace.pages}
          editor={!state.interactive}
        />
      )}
      <style>{`.s2-edit-canvas [data-builder-node]{cursor:pointer}.s2-edit-canvas [data-builder-node]:hover{outline:1px dashed #12BAAF;outline-offset:2px}.s2-edit-canvas .s2-selected{outline:2px solid #12BAAF!important;outline-offset:3px}.s2-edit-canvas [contenteditable=true]{outline:2px solid #FAF9FD!important;cursor:text!important;user-select:text;min-width:1ch}.s2-preview-notice{padding:15vh 8vw;color:#FAF9FD;background:#0D2F49;min-height:100vh}`}</style>
    </div>
  );
}
