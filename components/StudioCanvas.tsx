"use client";
import React, { useEffect, useRef, useCallback, useState } from "react";
import type { PageData, Globals } from "@/lib/types";
export default function StudioCanvas({
  page,
  globals,
  device,
  previewMotion,
  selected,
  onSelect,
  onNavigate,
}: {
  page: PageData;
  globals: Globals;
  device: "desktop" | "tablet" | "mobile";
  previewMotion: boolean;
  selected: string | null;
  onSelect: (id: string) => void;
  onNavigate: (route: string) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef({ page, globals, previewMotion, selected });
  latest.current = { page, globals, previewMotion, selected };
  const sync = useCallback(
    () =>
      frame.current?.contentWindow?.postMessage(
        { type: "showset-studio-state", ...latest.current },
        location.origin,
      ),
    [],
  );
  useEffect(() => {
    sync();
  }, [page, globals, previewMotion, selected, sync]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== location.origin ||
        event.source !== frame.current?.contentWindow
      )
        return;
      if (event.data?.type === "showset-studio-ready") sync();
      if (
        event.data?.type === "showset-studio-select" &&
        typeof event.data.id === "string"
      )
        onSelect(event.data.id);
      if (
        event.data?.type === "showset-studio-navigate" &&
        typeof event.data.route === "string"
      )
        onNavigate(event.data.route);
    };
    addEventListener("message", receive);
    return () => removeEventListener("message", receive);
  }, [onSelect, onNavigate, sync]);
  const host = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const width = device === "mobile" ? 390 : device === "tablet" ? 768 : 1440,
    height = device === "mobile" ? 844 : device === "tablet" ? 1024 : 900;
  useEffect(() => {
    const parent = host.current?.parentElement;
    if (!parent) return;
    const resize = () =>
      setScale(Math.min(1, Math.max(1, parent.clientWidth - 36) / width));
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [width]);
  return (
    <div
      ref={host}
      style={{
        width: width * scale,
        height: height * scale,
        margin: "auto",
        position: "relative",
      }}
    >
      <iframe
        ref={frame}
        className={`studio-preview-frame studio-preview-${device}`}
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
        title={`${device} website preview`}
        src="/studio-preview/"
        onLoad={sync}
      />
    </div>
  );
}
