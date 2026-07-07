/**
 * Generates /public/og-image.png (1200×630) and /public/favicon.ico (32×32)
 * from /public/bd_logo-icon.svg. Run: node scripts/generate-seo-assets.mjs
 */
import { readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const iconSvgPath = join(publicDir, 'bd_logo-icon.svg')

const iconSvg = await readFile(iconSvgPath, 'utf8')
const whiteIcon = iconSvg.replace(/fill="black"[^/]*/g, 'fill="white"')

const ogSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#1A1D20"/>
  <g transform="translate(80, 236) scale(2.8)">
    ${whiteIcon.replace(/<svg[^>]*>|<\/svg>/g, '')}
  </g>
  <text x="280" y="290" font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif" font-size="52" font-weight="700" fill="#FFFFFF">Black Diamond Marketplace</text>
  <text x="280" y="350" font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif" font-size="28" font-weight="400" fill="#9A9DA2">The World&apos;s Heavy Equipment Marketplace</text>
</svg>`

await sharp(Buffer.from(ogSvg))
  .png()
  .toFile(join(publicDir, 'og-image.png'))

await sharp(iconSvgPath)
  .resize(32, 32)
  .png()
  .toFile(join(publicDir, 'favicon.ico'))

console.log('Generated public/og-image.png and public/favicon.ico')
