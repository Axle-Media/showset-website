import p1 from "./legacy/12cbba7-pages.json";
import p2 from "./legacy/9307c4d-pages.json";
import p3 from "./legacy/1a59de3-pages.json";
import p4 from "./legacy/pre-source-pages.json";
import g1 from "./legacy/12cbba7-globals.json";
import g2 from "./legacy/9307c4d-globals.json";
import g3 from "./legacy/1a59de3-globals.json";
import p5 from "./legacy/pre-homepage-pages.json";
import g4 from "./legacy/pre-homepage-globals.json";
import { defaultPages, defaultGlobals } from "@/lib/data";
import type { PageData, Globals } from "@/lib/types";

type Value = unknown;
const same = (a: Value, b: Value) => JSON.stringify(a) === JSON.stringify(b);
const object = (x: Value): x is Record<string, Value> =>
  typeof x === "object" && x !== null && !Array.isArray(x);
/** Replace proven historical defaults only; keep custom values, added fields and IDs. */
function reconcile(value: Value, canonical: Value, legacy: Value[]): Value {
  if (canonical === undefined) return value;
  if (legacy.some((x) => same(value, x))) return structuredClone(canonical);
  if (Array.isArray(value) && Array.isArray(canonical)) {
    if (
      value.every((x) => object(x) && typeof x.id === "string") &&
      canonical.every((x) => object(x) && typeof x.id === "string")
    ) {
      const rows = value.map((x) => {
        const id = (x as Record<string, Value>).id;
        return reconcile(
          x,
          canonical.find((y) => (y as Record<string, Value>).id === id),
          legacy
            .filter(Array.isArray)
            .map((xs) => xs.find((y: Record<string, Value>) => y.id === id)),
        );
      });
      const ids = (xs: Value[]) =>
        xs.map((x) => (x as Record<string, Value>).id);
      if (
        value.length === canonical.length &&
        legacy.filter(Array.isArray).some((xs) => same(ids(value), ids(xs)))
      )
        return [...rows].sort(
          (a, b) =>
            ids(canonical).indexOf((a as Record<string, Value>).id) -
            ids(canonical).indexOf((b as Record<string, Value>).id),
        );
      return rows;
    }
    return value; // Custom menus/options without stable IDs are never guessed at.
  }
  if (object(value) && object(canonical))
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        reconcile(
          v,
          canonical[k],
          legacy.map((x) => (object(x) ? x[k] : undefined)),
        ),
      ]),
    );
  return value;
}
function preserveBeforeMigration() {
  const key = "showset-concept12-recovery";
  if (localStorage.getItem(key) && localStorage.getItem("showset-homepage-integration-recovery")) return;
  const records = Object.fromEntries(
    [
      "showset-demo-pages",
      "showset-demo-globals",
      "showset-preview-published-pages",
      "showset-preview-published-globals",
    ].map((k) => [k, localStorage.getItem(k)]),
  );
  const snapshot=JSON.stringify({version:1,createdAt:new Date().toISOString(),reason:"Raw local records retained before Concept 12 compatibility updates.",records});
  if(!localStorage.getItem(key))localStorage.setItem(key,snapshot);
  if(!localStorage.getItem("showset-homepage-integration-recovery"))
    localStorage.setItem("showset-homepage-integration-recovery",snapshot);
}
function safely<T>(value: T, canonical: Value, legacy: Value[]): T {
  const next = reconcile(value, canonical, legacy) as T;
  if (!same(value, next)) {
    try {
      preserveBeforeMigration();
    } catch (e) {
      console.warn(
        "Concept 12 compatibility backup could not be saved; original content retained.",
        e,
      );
      return value;
    }
  }
  return next;
}
export function compatiblePages(value: Record<string, PageData>) {
  const reconciled = safely(value, defaultPages, [p1, p2, p3, p4, p5]);
  const oldHero = reconciled.home?.sections.find((s) => s.type === "hero");
  // Only migrate this exact prior SHOWSET default. Custom hero copy remains intact.
  // Preserve the user's complete local records before changing their saved seed.
  if (oldHero?.headline !== "Great ideas" || oldHero.accent !== "should move people.")
    return reconciled;
  try {
    preserveBeforeMigration();
  } catch (e) {
    console.warn("SHOWSET hero copy migration skipped because backup was unavailable.", e);
    return reconciled;
  }
  const newHero = defaultPages.home.sections.find((s) => s.type === "hero");
  if (!newHero) return reconciled;
  return {
    ...reconciled,
    home: {
      ...reconciled.home,
      sections: reconciled.home.sections.map((s) =>
        s.id === oldHero.id
          ? { ...s, headline: newHero.headline, accent: newHero.accent }
          : s,
      ),
    },
  };
}
export function compatibleGlobals(value: Globals) {
  return safely(value, defaultGlobals, [g1, g2, g3, g4]);
}
