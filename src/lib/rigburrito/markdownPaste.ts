import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

const MARKDOWN_LINE =
  /^(?:#{1,6}\s|[-*+]\s|\d+\.\s|>\s|```| {4,}\S|\|.+\||\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\[.+?\]\(.+?\))/

/** True when plain text likely contains Markdown block/inline syntax. */
export function looksLikeMarkdown(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  return trimmed.split('\n').some(line => MARKDOWN_LINE.test(line.trim()))
}

/** Rich HTML paste from Word/Docs/etc. — defer to the default HTML parser. */
function isStructuredHtmlPaste(html: string): boolean {
  return /<(h[1-6]|ul|ol|li|blockquote|table|thead|tbody|pre)\b/i.test(html)
}

function shouldParsePasteAsMarkdown(plain: string, html: string): boolean {
  if (!looksLikeMarkdown(plain)) return false
  if (html.trim() && isStructuredHtmlPaste(html)) return false
  return true
}

export const MarkdownPaste = Extension.create({
  name: 'markdownPaste',
  priority: 1000,

  addProseMirrorPlugins() {
    const editor = this.editor

    return [
      new Plugin({
        key: new PluginKey('markdownPaste'),
        props: {
          handlePaste(_view, event) {
            if (!editor.markdown) return false

            const plain = event.clipboardData?.getData('text/plain') ?? ''
            const html = event.clipboardData?.getData('text/html') ?? ''

            if (!shouldParsePasteAsMarkdown(plain, html)) return false

            event.preventDefault()
            editor.commands.insertContent(plain, { contentType: 'markdown' })
            return true
          },
        },
      }),
    ]
  },
})
