export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function appendNote(existing: string | null, note: string): string {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 16)
  const entry = `[${ts}] ${note.trim()}`
  return existing ? `${existing}\n${entry}` : entry
}
