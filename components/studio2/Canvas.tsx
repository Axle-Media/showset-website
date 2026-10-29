"use client";
import { useEffect, useRef, useState } from "react";
import type { CanvasInspection } from "@/lib/studio2/selection";
import type { CanvasState } from "./Preview";
export default function Canvas({
  state,
  width,
  height,
  zoom,
  onSelect,
  onInline,
  onNavigate,
  onMetrics,
  onInspect,
}: {
  state: CanvasState;
  width: number;
  height: number;
  zoom: number | null;
  onSelect: (id: string) => void;
  onInline: (id: string, text: string, cancel: boolean) => void;
  onNavigate: (route: string) => void;
  onMetrics: (value: Record<string, string>) => void;
  onInspect: (selection: CanvasInspection) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null),
    host = useRef<HTMLDivElement>(null),
    latest = useRef(state),
    callbacks = useRef({
      onSelect,
      onInline,
      onNavigate,
      onMetrics,
      onInspect,
    });
  latest.current = state;
  callbacks.current = { onSelect, onInline, onNavigate, onMetrics, onInspect };
  const [fit, setFit] = useState(0.5);
  const send = () =>
    frame.current?.contentWindow?.postMessage(
      { type: "showset-studio2-state", state: latest.current },
      location.origin,
    );
  useEffect(() => {
    send();
  }, [state]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== location.origin ||
        event.source !== frame.current?.contentWindow
      )
        return;
      const d = event.data;
      if (d?.type === "showset-studio2-ready") send();
      if (d?.type === "showset-studio2-select" && typeof d.id === "string")
        callbacks.current.onSelect(d.id);
      if (
        d?.type === "showset-studio2-inline" &&
        typeof d.id === "string" &&
        typeof d.text === "string"
      )
        callbacks.current.onInline(d.id, d.text.slice(0, 20000), !!d.cancel);
      if (d?.type === "showset-studio2-navigate" && typeof d.route === "string")
        callbacks.current.onNavigate(d.route);
      if (
        d?.type === "showset-studio2-inspect" &&
        d.selection &&
        ["header", "footer", "section", "other"].includes(d.selection.area)
      )
        callbacks.current.onInspect(d.selection);
      if (d?.type === "showset-studio2-metrics")
        callbacks.current.onMetrics(d.value);
    };
    addEventListener("message", receive);
    return () => removeEventListener("message", receive);
  }, []);
  useEffect(() => {
    const e = host.current;
    if (!e) return;
    const resize = () =>
      setFit(Math.max(0.05, Math.min(1, (e.clientWidth - 32) / width)));
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(e);
    return () => observer.disconnect();
  }, [width]);
  const scale = zoom || fit;
  return (
    <div className="s2-canvas-scroll" ref={host}>
      <div
        className="s2-canvas-size"
        style={{ width: width * scale, height: height * scale }}
      >
        <iframe
          ref={frame}
          title="Studio 2.0 website canvas"
          src="/studio/next/preview/?canvas=1"
          onLoad={send}
          style={{
            width,
            height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
      <div className="s2-canvas-foot">
        {width} × {height} · {Math.round(scale * 100)}% ·{" "}
        {state.interactive
          ? "Interactive preview"
          : "Editing mode · click to select, double-click text to edit. Links and buttons are inactive."}
      </div>
    </div>
  );
}
