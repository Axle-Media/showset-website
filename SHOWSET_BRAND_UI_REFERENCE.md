# SHOWSET — Canonical Brand & Website UI Reference

**Authority:** `Showset_BrandGuide(3).pdf`, supplied 21 October 2026. The PDF, including its embedded visual examples, is the primary reference for design decisions. If a website concept or AI-generated visual conflicts with the guide, the guide wins. The approved Concept 12 HTML is the baseline for existing website structure and interactions, but it must remain on-brand.

## 1. Approved identity

- Use the **approved lowercase `showset.` wordmark artwork**, with the signature teal period. Do not typeset a new substitute, use an invented uppercase logo, or turn the brand into a generic event-company logo.
- Approved identities: horizontal main logo, square stacked logo, and icon. Preserve their clear space and proportions. Use the approved asset appropriate to the placement.
- Brand personality: creative, bold, original, inspired; also considered, purposeful, tailored and detail-driven. Confident and capable, but energetic, engaging and human.
- Brand voice: **creative, confident, engaging, human, direct**. Website prose from **we / our / us**, not third-person Showset. Avoid generic luxury-agency slogans and unsupported claims.

## 2. Colour hierarchy (guide p. 6)

| Role | Hex | Usage |
|---|---|---|
| Primary navy | `#0D2F49` | Dominant branded backgrounds and major surfaces |
| Secondary blue | `#153B54` | Depth, alternate surfaces, panels |
| Accent teal | `#12BAAF` | Purposeful emphasis, signature period, selected words, CTAs, icons |
| Alternative sand | `#E5D8C3` | Restrained neutral balance |
| Off-white | `#FAF9FD` | Main text and light surfaces |

Brand guide's indicative proportion: **45% navy / 30% blue / 15% white or alternative / 10% teal**. Teal is an accent, not a flood-fill default. Avoid introducing unapproved palette colours as a website design system.

## 3. Typography (guide p. 7)

- **Poppins:** Headlines and campaign statements.
- **Manrope:** Body copy, subheadings and buttons.
- Clear modern hierarchy; sentence case or uppercase according to approved composition. Reserve teal for meaningful words and CTAs.
- Guide examples: H1 54/68; H2 30/36; H3 18/24; body 11–14/18–22; CTA 10–12/bold. These are visual references, **not fixed CSS sizing for every screen**. Apply responsive type scales while preserving hierarchy and legibility.
- Avoid excessive tracking or excessively large headings that undermine SHOWSET's restrained feel.

## 4. Graphic devices and imagery (guide pp. 8–9)

- Use the **actual approved S + dot pattern**, at the guide's main, medium-cropped, or full-cropped treatments. Tone-on-tone / low opacity, large restrained crops, never a random invented texture.
- Signature teal period is a brand device. Rounded panels should have consistent soft corners. Leave generous margins and breathing room.
- Photography: authentic, creative, hands-on, warm, refined, dynamic, human. Prefer candid close-up actions: planning layouts, placing signage, adjusting production equipment, preparing and coordinating events, real work and real people.
- Natural/warm ambient lighting, realistic skin tones, subtle depth of field, clean focal points. Avoid endlessly repeated generic gala photos, unnatural neon, staged high-gloss corporate handshakes or fabricated client events.
- The images in the brand guide are explicitly **AI-generated style references**, not evidence of real SHOWSET projects. Use authenticated real project images when available; clearly identify illustrative/concept work.

## 5. Digital visual reference (guide p. 10)

- The digital application example is an especially important on-brand website reference: navy-first, off-white Poppins headings, selective teal phrases, compact teal CTA, warm human photograph, considered image crop, simple visible navigation, gentle corners and clean outlined icons.
- Icons: smooth, balanced, outlined, consistent stroke weights. Off-white on navy is the default; teal only for restrained highlights.
- Avoid invented award/statistic claims, invented client projects, unapproved logos, oversized controls, micro-label clutter, gratuitous image overlays and low-contrast type.

## 6. Website-specific UX interpretation (creative extension, not literal brand-guide requirements)

- Prioritise intuitive navigation and content hierarchy before spectacle: Home, About, Services (4 categories), Our Work, Contact.
- Homepage should tell the story through controlled cinematic movement and hands-on imagery, but content must remain readable even when animation is unavailable.
- Develop a cohesive brand motion system using the approved dot and circular motifs, not generic animations. Respect `prefers-reduced-motion`.
- Ensure every interactive element works by keyboard, touch, and pointer. Mobile layouts are deliberately composed, not blindly compressed desktop versions.
- Case studies must accurately show approved project evidence; interactive reveals are meaningful comparisons (concept / plan / execution / result), not decoration.
- Keep SHOWSET Studio consistent with the public site's actual React components; never let editor controls silently diverge from the published UI.
- Test motion and layouts at 320, 390, 768, 1024 and 1440 px; compare actual Next.js screenshots with approved references before declaring parity.

## 7. Rules for Codex and other coding agents

1. Before creating or changing page design, inspect the brand guide PDF's visual pages **2, 3, 6, 7, 8, 9 and 10**.
2. Reference approved logo assets rather than recreating the mark with text or adding an independent teal dot.
3. Do not infer or invent company statistics, client projects, locations, business claims, or contact details from mockups.
4. Distinguish **brand constraints** from **proposed UX enhancements**.
5. Change the real project, not a separate decorative HTML prototype. Preserve the working Save Draft / Publish Preview flow.
6. Capture and review actual runtime screenshots at matching viewports. Verify scroll states and focus/touch behaviour.
7. Never deploy to live `showset.co.za` without explicit approval.

*Source: SHOWSET Brand Guidelines, pages 1–10, uploaded by the user on 21 October 2026.*
