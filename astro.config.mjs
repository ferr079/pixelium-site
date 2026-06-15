// @ts-check
import { defineConfig } from 'astro/config';
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