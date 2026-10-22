# Issue 4: keyboard and motion-off quality gates

This fix retains the approved default-motion scenes, timings, photography and layout. Keyboard navigation now supports opening the services disclosure with arrow keys, returning focus on Escape, and wrapping Tab inside the open mobile navigation. Closed mobile navigation is inert. Opening panels keep the original opacity/transform animation while becoming focusable immediately. Carousel descendants follow each slide's visibility state.

Motion-off mode (OS preference, global toggle or Studio editing) exposes both hero messages and every story act in normal flow. Pinned waiting is removed only in that mode; services, real links, keyboard/swipe rail and forms remain functional. Explicit Studio typography, crop and radius overrides still work.

## Executed evidence

- Production build and TypeScript pass.
- Existing 50 functional assertions pass, including all original scroll scenes and Studio draft/publish/reload/geometry. The 13 lifecycle assertions pass with the new flow.
- `qa/concept12-accessibility.cjs` passes keyboard disclosure/focus return, mobile focus wrap/inert, all story acts without pinning, contact email validity/focus and selection Escape.
- All 12 public routes pass overflow, primary-heading visibility and loaded-image checks at 320, 390, 768, 1024 and 1440 widths, plus 390x320 and 1024x440 short heights. 720x450 is an emulated 200% reflow proxy for 1440x900; native browser zoom is not claimed.
- Chrome-generated touch events successfully swipe the case rail and follow a service link to its correct route. Emulation is not physical-device testing.
- No browser runtime errors in the executed suite. Results and reduced-motion screenshot are under docs/evidence/issue4.

## Outstanding acceptance

Physical iPhone Safari and Android Chrome sessions are unavailable, as confirmed by the owner. Real-device screenshots/recordings and native browser zoom remain outstanding. Contrast adjustments are a separate visual proposal for approval before merging. This issue cannot be marked fully complete without those checks. Hosted CI still cannot start because of account billing/spending restrictions. No main-branch merge, deployment, live CMS or mail change occurred.
