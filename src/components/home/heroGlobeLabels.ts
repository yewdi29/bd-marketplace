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

export function createGlobeLabel(labelRoot: HTMLElement): HTMLDivElement {
  const it = HERO_GLOBE_LABEL_ITEMS[Math.floor(Math.random() * HERO_GLOBE_LABEL_ITEMS.length)]
  const el = document.createElement('div')
  el.style.cssText =
    'position:absolute; transform:translate(-50%,-140%); display:flex; flex-direction:column; align-items:flex-start; gap:2px; padding:8px 12px; background:#fff; border:1px solid #E8E9EA; border-radius:10px; box-shadow:0 4px 24px rgba(0,0,0,0.06); white-space:nowrap; opacity:0; transition:opacity .35s ease; will-change:transform,opacity;'
  const name = document.createElement('div')
  name.style.cssText =
    'font-family:var(--font-inter, Inter, system-ui, sans-serif); font-size:13px; color:#1A1D20; font-weight:600; letter-spacing:-0.01em; line-height:1.2;'
  name.textContent = it.name
  const price = document.createElement('div')
  price.style.cssText =
    'font-family:var(--font-mono, "Andale Mono", monospace); font-size:12px; color:#FF6B35; font-weight:400; letter-spacing:0; line-height:1.2;'
  price.textContent = it.price
  el.appendChild(name)
  el.appendChild(price)
  labelRoot.appendChild(el)
  return el
}
