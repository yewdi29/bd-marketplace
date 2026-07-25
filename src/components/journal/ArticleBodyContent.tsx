import { Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { detectArticleBodyFormat } from '@/lib/journal/articleBodyFormat'

function splitChecklistItems(line: string): string[] {
  return line
    .split(/(?<=[.!?])\s+/)
    .map(item => item.trim())
    .filter(Boolean)
}

/** Legacy plain-text layout: blank-line blocks with first line as section heading. */
function LegacyPlainArticleBody({ body }: { body: string }) {
  const blocks = body.split(/\n\n+/).map(b => b.trim()).filter(Boolean)

  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
        const [heading, ...content] = lines
        const isChecklistSection = /checklist|testing|inspection/i.test(heading)

        return (
          <div key={i}>
            <h2 className="font-sans font-bold text-ink leading-[1.2] mt-10 mb-4" style={{ fontSize: '24px', letterSpacing: '-0.02em' }}>
              {heading}
            </h2>
            {content.map((line, j) => {
              const items = isChecklistSection ? splitChecklistItems(line) : [line]

              if (isChecklistSection && items.length > 1) {
                return (
                  <ul key={j} className="list-none pl-0 mb-6 space-y-3">
                    {items.map((item, k) => (
                      <li key={k} className="flex items-start gap-3">
                        <Check
                          className="shrink-0 mt-1"
                          style={{ width: '16px', height: '16px', color: '#FF6B35' }}
                          strokeWidth={3}
                        />
                        <span className="font-sans text-[15px] text-ink-2 leading-[1.8]">{item}</span>
                      </li>
                    ))}
                  </ul>
                )
              }

              return (
                <p key={j} className="font-sans text-[15px] text-ink-2 leading-[1.9] mb-6">
                  {line}
                </p>
              )
            })}
          </div>
        )
      })}
    </>
  )
}

export default function ArticleBodyContent({ body }: { body: string }) {
  const format = detectArticleBodyFormat(body)

  if (format === 'html') {
    return (
      <div
        className="article-body font-sans text-ink-2"
        dangerouslySetInnerHTML={{ __html: body }}
      />
    )
  }

  if (format === 'markdown') {
    return (
      <div className="article-body font-sans text-ink-2">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
      </div>
    )
  }

  return <LegacyPlainArticleBody body={body} />
}
