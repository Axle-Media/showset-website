import type { Metadata } from "next";
import StudioPreview from "@/components/StudioPreview";
export const metadata: Metadata = {
  title: "SHOWSET Studio preview",
  robots: { index: false, follow: false },
};
export default function PreviewPage() {
  return <StudioPreview />;
}
