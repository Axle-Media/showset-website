"use client";
import React, { useState, useEffect, useRef } from "react";
import type { PageData, Globals } from "@/lib/types";
import { defaultPages, defaultGlobals } from "@/lib/data";
import { SiteLayout } from "@/components/SiteShell";
export default function StudioPreview() {
  const [state, setState] = useState<{
    page: PageData;
    globals: Globals;
    previewMotion: boolean;
    selected: string | null;
  }>({
    page: defaultPages.home,
    globals: defaultGlobals,
    previewMotion: false,
    selected: null,
  });
  const preview = useRef(state.previewMotion);
  preview.current = state.previewMotion;
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== location.origin ||
        event.source !== parent ||
        event.data?.type !== "showset-studio-state"
      )
        return;
      const d = event.data;
      if (d.page?.sections && d.globals?.theme) setState(d);
    };
    const navigate = (event: MouseEvent) => {
      const a = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
      if (!a || a.target === "_blank") return;
      if (!preview.current) {
        event.preventDefault();
        return;
      }
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname)
        return;
      event.preventDefault();
      event.stopPropagation();
      parent.postMessage(
        { type: "showset-studio-navigate", route: url.pathname },
        location.origin,
      );
    };
    addEventListener("message", receive);
    document.addEventListener("click", navigate, true);
    parent.postMessage({ type: "showset-studio-ready" }, location.origin);
    return () => {
      removeEventListener("message", receive);
      document.removeEventListener("click", navigate, true);
    };
  }, []);
  return (
    <SiteLayout
      page={state.page}
      g={state.globals}
      editor={!state.previewMotion}
      selectedId={state.selected || undefined}
      onSelect={(id) =>
        parent.postMessage(
          { type: "showset-studio-select", id },
          location.origin,
        )
      }
    />
  );
}
