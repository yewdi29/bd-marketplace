export const HERO_GLOBE_LABEL_ITEMS = [
  { name: 'CAT D6T', price: '$185k' },
  { name: 'CAT 390F', price: '$450k' },
  { name: 'Komatsu PC210', price: '$220k' },
  { name: 'Volvo A40G', price: '$520k' },
  { name: 'CASE 2050M', price: '$165k' },
  { name: 'Liebherr LTM 1300', price: '$1.8M' },
  { name: 'Manitowoc 14000', price: '$2.1M' },
  { name: 'Terex RT780', price: '$340k' },
] as const

/** Pick a label index not used by any currently active arc. */
export function pickGlobeLabelIndex(usedIndices: readonly number[]): number | null {
  const used = new Set(usedIndices)
  const available = HERO_GLOBE_LABEL_ITEMS.map((_, i) => i).filter(i => !used.has(i))
  if (!available.length) return null
  return available[Math.floor(Math.random() * available.length)]
}

export function createGlobeLabel(labelRoot: HTMLElement, labelIndex: number): HTMLDivElement {
  const it = HERO_GLOBE_LABEL_ITEMS[labelIndex]
  const el = document.createElement('div')
  el.style.cssText =
    'position:absolute; transform:translate(-50%,-140%); display:flex; flex-direction:column; align-items:flex-start; gap:2px; padding:8px 12px; background:#fff; border:1px solid rgba(20,16,50,0.06); border-radius:10px; box-shadow:0 6px 20px rgba(40,20,90,0.12); white-space:nowrap; opacity:0; transition:opacity .35s ease; will-change:transform,opacity;'
  const name = document.createElement('div')
  name.style.cssText =
    'font-family:var(--font-inter, Inter, system-ui, sans-serif); font-size:13px; color:#15131a; font-weight:600; letter-spacing:-0.01em; line-height:1.2;'
  name.textContent = it.name
  const price = document.createElement('div')
  price.style.cssText =
    'font-family:var(--font-mono, "Andale Mono", monospace); font-size:12px; color:#f0571f; font-weight:400; letter-spacing:0; line-height:1.2;'
  price.textContent = it.price
  el.appendChild(name)
  el.appendChild(price)
  labelRoot.appendChild(el)
  return el
}
