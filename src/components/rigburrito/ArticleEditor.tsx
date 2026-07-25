'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from '@tiptap/markdown'
import { MarkdownPaste } from '@/lib/rigburrito/markdownPaste'
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered,
  Quote, Minus, Link as LinkIcon, ImageIcon, Eye, Code2,
} from 'lucide-react'

export type ArticleEditorMode = 'preview' | 'source'

export interface ArticleEditorHandle {
  /** Parse source markdown into the editor and return HTML for persistence. */
  commitSourceToPreview: () => string | null
  isSourceMode: () => boolean
}

interface ArticleEditorProps {
  content: string
  onChange: (html: string) => void
  onImageUpload?: (file: File) => Promise<string | null>
}

function ToolbarButton({ onClick, active, children }: { onClick: () => void; active?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded p-1.5"
      style={{
        background: active ? '#FFF2ED' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: active ? '#FF6B35' : '#6B7280',
      }}
    >
      {children}
    </button>
  )
}

function ModeToggle({
  mode,
  onPreview,
  onSource,
}: {
  mode: ArticleEditorMode
  onPreview: () => void
  onSource: () => void
}) {
  const baseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 8px',
    border: '1px solid #F0F1F3',
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
  }

  return (
    <div className="ml-auto flex shrink-0 overflow-hidden rounded-md">
      <button
        type="button"
        onClick={onPreview}
        aria-label="Preview"
        title="Preview"
        style={{
          ...baseStyle,
          borderRadius: '6px 0 0 6px',
          background: mode === 'preview' ? '#FFF2ED' : '#FFFFFF',
          color: mode === 'preview' ? '#FF6B35' : '#6B7280',
          borderRight: 'none',
        }}
      >
        <Eye size={16} strokeWidth={2} />
      </button>
      <button
        type="button"
        onClick={onSource}
        aria-label="Source"
        title="Source"
        style={{
          ...baseStyle,
          borderRadius: '0 6px 6px 0',
          background: mode === 'source' ? '#FFF2ED' : '#FFFFFF',
          color: mode === 'source' ? '#FF6B35' : '#6B7280',
        }}
      >
        <Code2 size={16} strokeWidth={2} />
      </button>
    </div>
  )
}

const ArticleEditor = forwardRef<ArticleEditorHandle, ArticleEditorProps>(function ArticleEditor(
  { content, onChange, onImageUpload },
  ref,
) {
  const [mode, setMode] = useState<ArticleEditorMode>('preview')
  const [sourceText, setSourceText] = useState('')
  const modeRef = useRef<ArticleEditorMode>('preview')

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: 'Start writing...' }),
      Markdown,
      MarkdownPaste,
    ],
    content,
    onUpdate: ({ editor: e }) => {
      if (modeRef.current === 'preview') onChange(e.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[400px] px-4 py-3 outline-none',
      },
    },
  })

  const applySourceToPreview = useCallback((): string | null => {
    if (!editor) return null
    editor.commands.setContent(sourceText, { contentType: 'markdown' })
    const html = editor.getHTML()
    onChange(html)
    setMode('preview')
    return html
  }, [editor, onChange, sourceText])

  useImperativeHandle(ref, () => ({
    commitSourceToPreview: () => {
      if (!editor) return null
      if (mode === 'preview') return editor.getHTML()
      return applySourceToPreview()
    },
    isSourceMode: () => mode === 'source',
  }), [applySourceToPreview, editor, mode])

  const switchToSource = useCallback(() => {
    if (!editor || mode === 'source') return
    setSourceText(editor.getMarkdown())
    setMode('source')
  }, [editor, mode])

  const switchToPreview = useCallback(() => {
    if (!editor || mode === 'preview') return
    applySourceToPreview()
  }, [applySourceToPreview, editor, mode])

  const addLink = useCallback(() => {
    if (!editor) return
    const url = window.prompt('URL')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(async () => {
    if (!editor || !onImageUpload) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const url = await onImageUpload(file)
      if (url) editor.chain().focus().setImage({ src: url }).run()
    }
    input.click()
  }, [editor, onImageUpload])

  if (!editor) return null

  return (
    <div className="rigburrito-card flex h-full flex-col">
      <div
        className="flex flex-wrap items-center gap-1 border-b px-2 py-2"
        style={{ borderColor: '#F0F1F3' }}
      >
        {mode === 'preview' && (
          <>
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}><Bold size={16} /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}><Italic size={16} /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}><Heading2 size={16} /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}><Heading3 size={16} /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}><List size={16} /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}><ListOrdered size={16} /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}><Quote size={16} /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={16} /></ToolbarButton>
            <ToolbarButton onClick={addLink} active={editor.isActive('link')}><LinkIcon size={16} /></ToolbarButton>
            {onImageUpload && <ToolbarButton onClick={addImage}><ImageIcon size={16} /></ToolbarButton>}
          </>
        )}
        {mode === 'source' && (
          <span className="rigburrito-caption px-1">Raw Markdown — paste and edit freely, then switch to Preview</span>
        )}
        <ModeToggle mode={mode} onPreview={switchToPreview} onSource={switchToSource} />
      </div>

      {mode === 'preview' ? (
        <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
      ) : (
        <textarea
          value={sourceText}
          onChange={e => setSourceText(e.target.value)}
          spellCheck={false}
          className="rigburrito-mono flex-1 resize-none border-0 px-4 py-3 outline-none"
          style={{
            minHeight: 400,
            fontSize: 13,
            lineHeight: 1.7,
            color: '#0F1117',
            background: '#FFFFFF',
          }}
          placeholder="Paste Markdown here…"
        />
      )}
    </div>
  )
})

export default ArticleEditor
