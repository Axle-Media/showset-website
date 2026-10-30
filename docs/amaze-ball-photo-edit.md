# The Amaze-Ball photo selection and edit

Reviewed 221 supplied photographs from `C:/Users/james/OneDrive/Pictures/Amazeballs` and selected 20 varied frames. The case-study gallery grows from nine to 20 images, covering event production, the ball installation, players, guests, interview, artist, hospitality, fundraising details and preparation/live control.

The selected camera originals remain untouched. New `*-edited-v2.webp` files are AI-assisted edits made with the built-in image tool, with prompts requesting exposure/colour/noise correction and preservation of people, signage and event details. These are generative edits, not pixel-identical conventional adjustments. Native output PNGs, full prompts, source filenames and original/edited comparisons are retained in the workspace `output/amazeballs-edit/` directory. Native edited outputs are approximately 1672 × 940; exports never upscale them.

The responsive library includes full-size, 960px and 480px WebP versions, plus a dedicated phone crop of the main hero to keep the MC's face in frame. The same authored hero drives the homepage and portfolio cards. Chapter images and the 20-image lightbox use the selected set. Previous media remains available for rollback.

The current main branch was merged before the update, preserving Elmboog and the newer navigation work. Compatibility migrates proven saved defaults and backs them up, while preserving custom authored case studies and image URLs.

Validation: source and case-study asset checks, TypeScript, SEO, 30-record portfolio regression and production build. Desktop/mobile browser checks cover 20 gallery items, decoded responsive assets, keyboard lightbox wrapping/close, featured cards, no overflow/runtime errors, and migration from the previous default catalogue. The original/edited comparison gallery and downloadable archive are outside the public web root.
