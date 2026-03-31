/** Base URL for image assets hosted on Cloudflare R2 */
export const ASSETS_BASE = 'https://assets.pixelium.win';

/** Prefix a local image path with the R2 base URL */
export function assetUrl(path: string): string {
  return `${ASSETS_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}
