export type BlockType =
  | "hero"
  | "pagehero"
  | "split"
  | "story"
  | "services"
  | "work"
  | "dot"
  | "cta"
  | "visual"
  | "items"
  | "accordion"
  | "contact";
export interface BlockItem {
  id: string;
  title: string;
  accent?: string;
  description: string;
  image?: string;
  href?: string;
  category?: string;
  video?: string;
}
export interface BlockDesign {
  spaceTop?: number;
  spaceBottom?: number;
  headingSize?: number;
  mobileHeadingSize?: number;
  bodySize?: number;
  imagePosition?: string;
  mobileImagePosition?: string;
  motionPreset?: "cinematic" | "short" | "still";
  variation?: "editorial" | "compact";
  radius?: number;
}
export interface Block {
  design?: BlockDesign;
  id: string;
  type: BlockType;
  headline: string;
  accent: string;
  body: string;
  image: string;
  pattern: boolean;
  reveal: boolean;
  buttonLabel: string;
  buttonHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  items: BlockItem[];
  speed: number;
  formTitle: string;
  helperText: string;
}
export interface ProjectModule {
  id: string;
  kind: "text" | "image" | "video" | "comparison";
  title: string;
  body?: string;
  src?: string;
  after?: string;
  alt?: string;
  captions?: string;
}
export interface PageData {
  projectModules?: ProjectModule[];
  slug: string;
  route: string;
  title: string;
  sections: Block[];
  seo: { title: string; description: string };
}
export interface ThemeTokens {
  navy: string;
  navyDark: string;
  blue: string;
  teal: string;
  sand: string;
  white: string;
  fontHeading: string;
  fontBody: string;
  headingTracking: string;
  bodyTracking: string;
  headingLeading: number;
  bodyLeading: number;
  sectionSpace: number;
  radius: number;
  buttonHeight: number;
  patternOpacity: number;
}
export interface Globals {
  brand: { wordmark: string; tagline: string; logo?: string };
  header: {
    buttonLabel: string;
    buttonHref: string;
    links: { label: string; href: string }[];
    services: { label: string; href: string }[];
  };
  footer: {
    description: string;
    links: { label: string; href: string }[];
    copyright: string;
  };
  theme: ThemeTokens;
  motion: {
    enabled: boolean;
    circleReveal: boolean;
    heroScale: number;
    storyParallax: number;
    carouselSeconds: number;
  };
}
