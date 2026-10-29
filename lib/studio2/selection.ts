export interface CanvasInspection {
  area: "header" | "footer" | "section" | "other";
  name: string;
  sectionId?: string;
  image?: boolean;
  src?: string;
}
