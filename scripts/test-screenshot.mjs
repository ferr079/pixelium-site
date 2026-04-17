import { chromium } from 'playwright';

const url = process.argv[2] || 'https://traefik.pixelium.internal';
const output = process.argv[3] || '/tmp/test-screenshot.png';

const browser = await chromium.launch({
  args: ['--ignore-certificate-errors', '--no-sandbox'],
});

const page = await browser.newPage({
  viewport: { width: 2400, height: 1350 },
  deviceScaleFactor: 1,
});

await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(2000); // let animations settle

await page.screenshot({ path: output, fullPage: false });
console.log(`Screenshot saved: ${output}`);

const { width, height } = page.viewportSize();
console.log(`Viewport: ${width}x${height}`);

await browser.close();
