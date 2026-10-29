import Studio2 from "@/components/studio2/Studio2";
export const metadata = {
  title: "SHOWSET Studio 2.0 | Local visual editor",
  robots: { index: false, follow: false },
};
export default function StudioNextPage() {
  return process.env.NODE_ENV === "development" ? (
    <Studio2 />
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
