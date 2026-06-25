// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import { execFileSync } from 'node:child_process';

// Build provenance — "THIS DEPLOYMENT": proves which commit built the page.
// CI sets GITHUB_SHA; local falls back to git. Edge colo is resolved live by /api/deployment.
const commitSha = process.env.GITHUB_SHA
  || (() => { try { return execFileSync('git', ['rev-parse', 'HEAD']).toString().trim(); } catch { return 'dev'; } })();
const buildTime = new Date().toISOString();

// https://astro.build/config
export default defineConfig({
  site: 'https://pixelium.win',
  adapter: cloudflare({
    prerenderEnvironment: 'node',
    remoteBindings: false,
  }),
  integrations: [sitemap({
    // Exclude archived / redirect-only pages from the sitemap (refonte V4)
    filter: (page) => !/\/(ia|uses|cybersecurite|symbiose)(\/|$)/.test(page),
  })],
  // Self-hosted JetBrains Mono via the official Fonts API — automatic preload +
  // optimized fallback metrics (no CLS) + subsetting. Same-origin, no third-party.
  fonts: [{
    provider: fontProviders.local(),
    name: 'JetBrains Mono',
    cssVariable: '--font-jetbrains-mono',
    // Generic fallback MUST be monospace (default is sans-serif): box-drawing/block
    // glyphs used in the ASCII art aren't in the latin subset, so they fall through
    // to the fallback — which must stay fixed-width or the ASCII art misaligns.
    fallbacks: ['monospace'],
    options: {
      variants: [
        { weight: 400, style: 'normal', src: ['./src/assets/fonts/jetbrains-mono-latin-400.woff2'] },
        { weight: 500, style: 'normal', src: ['./src/assets/fonts/jetbrains-mono-latin-500.woff2'] },
        { weight: 600, style: 'normal', src: ['./src/assets/fonts/jetbrains-mono-latin-600.woff2'] },
        { weight: 700, style: 'normal', src: ['./src/assets/fonts/jetbrains-mono-latin-700.woff2'] },
      ],
    },
  }],
  i18n: {
    locales: ['en', 'fr'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    define: {
      'import.meta.env.PUBLIC_COMMIT_SHA': JSON.stringify(commitSha),
      'import.meta.env.PUBLIC_BUILD_TIME': JSON.stringify(buildTime),
    },
    build: {
      // Astro 7 / Vite 8 default CSS minifier (esbuild) wrongly folds
      // `animation-timeline: view()` into the `animation` shorthand →
      // `animation: linear both reveal-in view()` (invalid) → scroll-reveal
      // never runs → content stuck at opacity:0. Disable CSS minify to keep the
      // source intact. TEST — verify the .reveal rule before keeping.
      cssMinify: false,
    },
  },
});