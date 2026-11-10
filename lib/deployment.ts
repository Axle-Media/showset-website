/** Static hosting does not imply that the PHP Studio publishing backend exists.
 * Enable it ONLY in a separately secured build with a configured PHP API.
 * Ordinary Vercel and public xneelo exports must remain read-only. */
export const publishingBackendAvailable = (_hostname: string) =>
  process.env.NEXT_PUBLIC_SHOWSET_BACKEND_ENABLED === 'true';
