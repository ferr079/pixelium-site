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
  },
});