import Preview from "@/components/studio2/Preview";
export const metadata = {
  title: "SHOWSET Studio 2.0 | Local preview",
  robots: { index: false, follow: false },
};
export default function PreviewPage() {
  return (process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_SHOWSET_STUDIO_CLOUD_ENABLED === "true") ? (
    <Preview />
  ) : (
    <main style={{ padding: "10vh 8vw" }}>
      <h1>Private editing workspace</h1>
      <p>
        Studio 2.0 is not enabled in public builds. Use the local development
        workspace.
      </p>
    </main>
  );
}
