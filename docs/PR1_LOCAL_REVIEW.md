# Local review of PR 1

The local quality gates pass: locked npm install (zero reported vulnerabilities), TypeScript, source/assets, SEO metadata validation and the production static build. The existing 50 functional, 22 refinement and 9 global Studio editing browser assertions pass. The new SEO regression checks cover all 12 routes both before and after hydration (24 cases).

Review found a metadata ownership defect: the legacy runtime replaced authored descriptions during hydration, which caused conflicting description tags on secondary routes. Static route metadata and in-page navigation now use the same authored metadata helper. After the fix every tested route has exactly one correct description, with JavaScript enabled and disabled. Animation equations, choreography, CSS, layouts, photographs and Studio saving code are unchanged.

The GitHub Actions failure is external to the code: run 39755734883, job 119747146034 has an empty runner name and zero steps. GitHub's failure annotation says the job could not start because recent account payments failed or the spending limit needs increasing. The separate Ubuntu runner image notice is informational. No billing settings were changed.

Local evidence includes 348 scene captures at six widths, Studio edit/save/publish tests and desktop/mobile motion recordings. Captures exposed the known homepage-first shell on a delayed secondary-route hydration; issue 2 is responsible for correcting initial HTML. Affected captures were repeated after explicitly waiting for the intended active route. Transient carousel/reveal frames are not claimed as exact pixel matches.

Recommendation: ready for human review with the metadata fix. Local checks support merging the scoped quality/SEO work, but GitHub CI remains unverified until the account restriction is resolved. Keep this PR draft/unmerged until owner approval. Initial route HTML, lifecycle and contrast/device gates remain the separate follow-up issues; this review does not claim those are complete.

No deployment, hosting change or live CMS action was performed. Physical iOS Safari and Android Chrome were not connected; device emulation is not physical-device QA.
