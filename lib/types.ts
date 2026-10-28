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
  variation?: "editorial" | "compact" | "photographic";
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
export interface CaseStoryChapter { heading: string; body: string; image?: string; imageAlt?: string; /** Retained legacy media; first valid photo maps to image when unset. */ images?: string[]; }
export interface CaseExperience {
  demo?: boolean;
  /** Public filter tags for the Our Work gallery. */
  tags?: string[];
  openingTitle: string;
  openingBody: string;
  openingImage: string;
  secondTitle?: string;
  secondImage: string;
  secondBody: string;
  brief: CaseStoryChapter;
  intention: CaseStoryChapter;
  approach: CaseStoryChapter;
  gallery: { id?: string; src: string; alt: string; credit?: string; creditHref?: string; license?: string; licenseHref?: string }[];
  /** Legacy saved data only; the image-window component has been removed. */
  bannerImage?: string;
  bannerAlt?: string;
  partners?: { name: string; role?: string; logo?: string; href?: string }[];
}
export interface PageData {
  /** ISO 8601 date for newest-first portfolio ordering. */
  publishedAt?: string;
  caseExperience?: CaseExperience;
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
    signoff?: string;
    contact?: { email: string; phone: string; location: string };
    socials?: { facebook: string; instagram: string; linkedin: string };
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
