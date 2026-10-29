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
import { caseExperienceFor } from "@/lib/concept-12/case-content";
import { applyTemplateExtensions } from "@/lib/studio2/template-extensions";
import { nodeMotions } from "@/lib/studio2/render";
import { mountNodeMotion } from "@/lib/studio2/motion";
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
    const back = () => {
      const slug = new URLSearchParams(location.search).get("page") || "home";
      setState((value) =>
        value?.workspace.pages[slug] ? { ...value, slug } : value,
      );
    };
    addEventListener("popstate", back);
    return () => {
      removeEventListener("message", receive);
      removeEventListener("popstate", back);
    };
  }, []);
  useEffect(() => {
    if (!state) return;
    const page = state.workspace.pages[state.slug];
    document.title = page.seo.title || page.title;
    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.append(meta);
    }
    meta.content = page.seo.description || "";
  }, [state?.workspace.pages, state?.slug]);
  useLayoutEffect(() => {
    const root = host.current;
    if (!root || !state) return;
    let frame = 0;
    let disposeTemplateMotion: (() => void) | null = null;
    const observer = new MutationObserver(() => {
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          sync();
        });
    });
    const sync = () => {
      observer.disconnect();
      const page = state.workspace.pages[state.slug];
      if (page.builder?.mode !== "custom") {
        applyTemplateOverrides(root, page, true, state.urls);
        // Mount only owner-created sections after the approved native layout.
        // Recreate on every canonical draft update, not in the public website.
        disposeTemplateMotion?.();
        disposeTemplateMotion = null;
        const extension = applyTemplateExtensions(root, page, state.urls);
        if (extension)
          disposeTemplateMotion = mountNodeMotion(
            extension,
            nodeMotions(page),
            state.interactive && state.workspace.globals.motion.enabled,
          );
      }
      // The case study owns its opening photograph everywhere it appears.
      // Reflect unpublished local originals in linked Home, Our Work and
      // related-story cards instead of creating a second editable copy.
      for (const link of root.querySelectorAll<HTMLAnchorElement>('a[href^="/work/"]')) {
        const project = Object.values(state.workspace.pages).find(
          (entry) => entry.route === link.getAttribute("href"),
        );
        if (!project) continue;
        const source = caseExperienceFor(project).openingImage;
        if (!source.startsWith("asset:")) continue;
        const url = state.urls[source.slice(6)];
        const image = link.querySelector<HTMLImageElement>("img");
        if (url && image && image.getAttribute("src") !== url) image.src = url;
      }
      root
        .querySelectorAll("[data-studio2-image-handle]")
        .forEach((element) => element.remove());
      if (state.workspace.globals.brand.logo?.startsWith("asset:"))
        root
          .querySelectorAll<HTMLImageElement>(".brand img")
          .forEach(
            (img) =>
              (img.src =
                state.urls[state.workspace.globals.brand.logo!.slice(6)] || ""),
          );
      if (!state.interactive) {
        const groups = new Map<
          HTMLElement,
          { ids: string[]; sectionId?: string }
        >();
        for (const b of templateBindings(page).filter(
          (b) => b.kind === "image",
        )) {
          const img = root.querySelector<HTMLElement>(b.selector),
            section = img?.closest<HTMLElement>("[data-section]");
          if (!section) continue;
          const group = groups.get(section) || {
            ids: [],
            sectionId: b.sectionId,
          };
          group.ids.push(b.id);
          groups.set(section, group);
        }
        root
          .querySelectorAll<HTMLElement>(".s2-node-image")
          .forEach((figure) =>
            groups.set(figure, { ids: [figure.dataset.builderNode!] }),
          );
        for (const [container, group] of groups) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "s2-image-handle";
          button.dataset.studio2ImageHandle = "true";
          button.textContent =
            group.ids.length === 1 ? "Edit image" : "Edit section images";
          if (group.ids.length === 1)
            button.dataset.studio2Select = group.ids[0];
          else button.dataset.studio2SectionImages = group.sectionId;
          container.append(button);
        }
      }
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
            display: computed.display,
            direction: computed.flexDirection,
            align: computed.alignItems,
            justify: computed.justifyContent,
            textAlign: computed.textAlign,
            opacity: computed.opacity,
            objectFit: computed.objectFit,
            objectPosition: computed.objectPosition,
            width: computed.width,
            height: computed.height,
            padding: computed.padding,
            margin: computed.margin,
            gap: computed.gap,
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            fontFamily: computed.fontFamily.includes("Poppins")
              ? "Poppins"
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
      root.dataset.studio2Ready = String(
        !!root.querySelector(".concept-12-root #main"),
      );
      observer.observe(root, { childList: true, subtree: true });
    };
    sync();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      disposeTemplateMotion?.();
    };
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
    const selectElement = (
      clicked: Element,
      point?: { x: number; y: number },
    ) => {
      const handle = clicked.closest<HTMLElement>("[data-studio2-select]");
      if (handle) {
        send("showset-studio2-select", { id: handle.dataset.studio2Select });
        return;
      }
      const group = clicked.closest<HTMLElement>(
        "[data-studio2-section-images]",
      );
      if (group) {
        send("showset-studio2-inspect", {
          selection: {
            area: "section",
            sectionId: group.dataset.studio2SectionImages,
            image: true,
            name: "Section images",
          },
        });
        return;
      }
      if (
        point &&
        !clicked.closest(
          "h1,h2,h3,h4,p,a,button,input,textarea,select,summary,[data-inline-editing]",
        )
      ) {
        for (const element of root.querySelectorAll<HTMLElement>(
          "img[data-builder-node],.s2-node-image[data-builder-node]",
        )) {
          const img = element.matches("img")
            ? element
            : element.querySelector<HTMLElement>("img");
          if (!img) continue;
          const rect = img.getBoundingClientRect();
          if (
            point.x < rect.left ||
            point.x > rect.right ||
            point.y < rect.top ||
            point.y > rect.bottom ||
            !rect.width ||
            !rect.height
          )
            continue;
          let visible = true;
          for (
            let ancestor: HTMLElement | null = img;
            ancestor && ancestor !== root;
            ancestor = ancestor.parentElement
          ) {
            const style = getComputedStyle(ancestor);
            if (
              style.display === "none" ||
              style.visibility === "hidden" ||
              Number(style.opacity) < 0.01
            ) {
              visible = false;
              break;
            }
          }
          if (visible) {
            send("showset-studio2-select", { id: element.dataset.builderNode });
            return;
          }
        }
      }
      const target = clicked.closest<HTMLElement>("[data-builder-node]");
      if (target) {
        send("showset-studio2-select", { id: target.dataset.builderNode });
        return;
      }
      const section = clicked.closest<HTMLElement>("[data-section]"),
        image = !!clicked.closest("img");
      const area = clicked.closest("#site-header,#mobile-panel")
        ? "header"
        : clicked.closest("footer")
          ? "footer"
          : section
            ? "section"
            : "other";
      send("showset-studio2-inspect", {
        selection: {
          area,
          sectionId: section?.dataset.section,
          image,
          src: clicked.closest("img")?.getAttribute("src") || undefined,
          name:
            area === "header"
              ? "Header navigation"
              : area === "footer"
                ? "Footer content"
                : image
                  ? "Section images"
                  : "Section content",
        },
      });
    };
    const choose = (event: MouseEvent) => {
      if (
        current.current?.interactive ||
        (event.target as Element).closest("[data-inline-editing]")
      )
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
      selectElement(event.target as Element, {
        x: event.clientX,
        y: event.clientY,
      });
    };
    const guardPointer = (event: Event) => {
      if (
        current.current?.interactive ||
        (event.target as Element).closest("[data-inline-editing]")
      )
        return;
      event.stopImmediatePropagation();
      if (
        (event.target as Element).closest(
          "a,button,input,textarea,select,summary,video",
        )
      )
        event.preventDefault();
    };
    const guardSubmit = (event: Event) => {
      if (!current.current?.interactive) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
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
      editing.contentEditable = "plaintext-only";
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
      if (
        !current.current?.interactive &&
        !editing &&
        [
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "Home",
          "End",
        ].includes(event.key) &&
        (event.target as Element).closest(
          "a,button,input,select,textarea,[data-case-gallery],#case-carousel",
        )
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      if (
        !current.current?.interactive &&
        !editing &&
        ["Enter", " "].includes(event.key)
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        selectElement(event.target as Element);
        return;
      }
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
      if (url.origin === location.origin && !url.hash) {
        const data = current.current,
          next = Object.values(data!.workspace.pages).find(
            (p) => p.route === url.pathname,
          );
        event.preventDefault();
        event.stopImmediatePropagation();
        if (parent !== window)
          send("showset-studio2-navigate", { route: url.pathname });
        else if (next) {
          setState((previous) =>
            previous ? { ...previous, slug: next.slug } : null,
          );
          history.pushState(
            {},
            "",
            "/studio/next/preview/?page=" + encodeURIComponent(next.slug),
          );
          scrollTo(0, 0);
        }
      }
    };
    const leave = (event: BeforeUnloadEvent) => {
      if (editing) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    root.addEventListener("pointerdown", guardPointer, true);
    root.addEventListener("mousedown", guardPointer, true);
    root.addEventListener("submit", guardSubmit, true);
    root.addEventListener("auxclick", choose, true);
    root.addEventListener("click", choose, true);
    root.addEventListener("dblclick", edit, true);
    root.addEventListener("focusout", blur, true);
    root.addEventListener("keydown", key, true);
    root.addEventListener("click", links, true);
    return () => {
      window.removeEventListener("beforeunload", leave);
      root.removeEventListener("pointerdown", guardPointer, true);
      root.removeEventListener("mousedown", guardPointer, true);
      root.removeEventListener("submit", guardSubmit, true);
      root.removeEventListener("auxclick", choose, true);
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
          suppressSubmissions
        />
      )}
      <style>{`.s2-edit-canvas [data-builder-node]{cursor:pointer}.s2-edit-canvas [data-builder-node]:hover{outline:1px dashed #12BAAF;outline-offset:2px}.s2-edit-canvas .s2-selected{outline:2px solid #12BAAF!important;outline-offset:3px}.s2-edit-canvas [data-inline-editing]{outline:2px solid #FAF9FD!important;cursor:text!important;user-select:text;min-width:1ch}.s2-edit-canvas .s2-image-handle{position:absolute;right:18px;top:18px;z-index:80;background:#12BAAF!important;color:#062739!important;font:700 14px/1.3 Poppins,sans-serif!important;padding:11px 16px!important;border:1px solid #FAF9FD!important;border-radius:6px!important;pointer-events:auto!important;cursor:pointer!important;box-shadow:0 3px 14px #0005}.s2-edit-canvas #hero-track>.s2-image-handle{top:calc(var(--header-height,78px) + 12px)}.s2-edit-canvas .s2-image-handle:focus-visible{outline:3px solid #FAF9FD;outline-offset:3px}.s2-preview-notice{padding:15vh 8vw;color:#FAF9FD;background:#0D2F49;min-height:100vh}`}</style>
    </div>
  );
}
