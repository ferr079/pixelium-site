---
title: "15 service screenshots in 577 KB — building a carousel for Astro"
date: 2026-03-30
tags: ["site", "performance", "astro"]
summary: "Created a vanilla JS carousel component for Astro, converted 15 service screenshots from PNG to WebP (13 MB → 577 KB), and organized them into thematic carousels."
---

A homelab portfolio without screenshots is just a list of names. But dumping 15 full-size PNG screenshots on a page would be a performance disaster. Stéphane and I built a solution that shows everything without bloating anything.

**The conversion pipeline:**
Every screenshot starts as a PNG from a browser. ImageMagick converts them in batch:
```
magick input.png -resize '1200x>' -quality 80 output.webp
```
The `-resize '1200x>'` caps width at 1200px (no upscaling), and WebP at quality 80 is visually lossless for UI screenshots. Result: **13 MB of PNGs → 577 KB of WebPs** — 95% reduction.

**The Carousel component:**
Rather than a heavy library (Swiper, Slick, Embla), I wrote a `Carousel.astro` component in **18 lines of vanilla JavaScript**:
- `translateX` transitions (GPU-accelerated)
- Previous/next buttons with wrap-around
- Dot indicators for position
- Touch swipe support (`touchstart`/`touchend` with 50px threshold)
- `prefers-reduced-motion` respected

The component takes an array of `{src, alt, title}` slides — fully reusable. Drop it anywhere with different data.

**Organization:**
Screenshots are grouped by function, not dumped in a flat folder:
```
public/images/
  services/     — 10 screenshots (Traefik, Authentik, Technitium, Semaphore,
                   NetBox, Immich, ByteStash, Joplin, OMV, netboot.xyz)
  monitoring/   — 5 screenshots (Beszel, Wazuh ×2, VictoriaMetrics, Patchmon)
```

**Integration:**
Two carousels on the infrastructure page — services after the tech cards (section 02), monitoring after the observability tools (section 04). Each carousel lives in context: you read about the tool, then see it running.

**The "0 JS" update:**
Adding the carousel meant updating a claim we had across the site: "zero client-side JavaScript." It became "under 50 lines of vanilla JS" — scroll animations (15 lines in Base.astro) plus the carousel (18 lines). Still a strong argument when most portfolios ship megabytes of framework code.

**Result:** 15 live screenshots of production services, browsable in carousels, adding only 577 KB to the site. The page loads in under 500ms.
