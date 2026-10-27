/** Vercel static exports have no PHP backend. An explicitly configured proxy can opt in. */
export const publishingBackendAvailable=(hostname:string)=>process.env.NEXT_PUBLIC_SHOWSET_BACKEND_ENABLED==='true'||!hostname.endsWith('.vercel.app');
