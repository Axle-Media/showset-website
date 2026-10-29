"use client";
import { useEffect } from "react";

/** A small accessible menu controller for static legal routes. */
export default function LegalMobileMenu() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".legal-page");
    const header = root?.querySelector<HTMLElement>(".site-header");
    const toggle = root?.querySelector<HTMLButtonElement>(".mobile-toggle");
    const panel = root?.querySelector<HTMLElement>(".mobile-panel");
    if (!root || !header || !toggle || !panel) return;

    const setOpen = (open: boolean) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      panel.classList.toggle("open", open);
      panel.setAttribute("aria-hidden", String(!open));
      panel.inert = !open;
      header.classList.toggle("menu-is-open", open);
      document.body.classList.toggle("menu-open", open);
    };
    const onToggle = () => setOpen(toggle.getAttribute("aria-expanded") !== "true");
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
      if (event.key !== "Tab" || toggle.getAttribute("aria-expanded") !== "true") return;
      const stops = [toggle, ...Array.from(panel.querySelectorAll<HTMLAnchorElement>("a[href]"))];
      const index = stops.indexOf(document.activeElement as HTMLButtonElement & HTMLAnchorElement);
      if (index < 0 || (event.shiftKey && index === 0) || (!event.shiftKey && index === stops.length - 1)) {
        event.preventDefault();
        stops[event.shiftKey ? stops.length - 1 : 0]?.focus();
      }
    };
    const year = root.querySelector<HTMLElement>("#year");
    if (year) year.textContent = String(new Date().getFullYear());
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 24);
    const onNavigation = () => setOpen(false);
    setOpen(false);
    onScroll();
    toggle.addEventListener("click", onToggle);
    panel.addEventListener("click", onNavigation);
    document.addEventListener("keydown", onKeydown);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      setOpen(false);
      toggle.removeEventListener("click", onToggle);
      panel.removeEventListener("click", onNavigation);
      document.removeEventListener("keydown", onKeydown);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return null;
}
