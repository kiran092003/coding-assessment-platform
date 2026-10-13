import React from 'react'

/* A deliberately small Markdown renderer covering the subset used by problem
   statements: paragraphs, **bold**, `code`, fenced blocks, bullet and numbered
   lists, and #/## headings.

   Everything is emitted as React elements, never as raw HTML, so an
   admin-authored statement cannot inject markup. */

/* Splits a line into text, **bold** and `code` runs. */
function inline(text, keyPrefix) {
  const parts = []
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let last = 0
  let m
  let i = 0

  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const token = m[0]
    if (token.startsWith('**')) {
      parts.push(
        <strong key={`${keyPrefix}-b${i++}`} className="font-semibold text-on-surface">
          {token.slice(2, -2)}
        </strong>,
      )
    } else {
      parts.push(
        <code
          key={`${keyPrefix}-c${i++}`}
          className="rounded px-1.5 py-0.5 font-mono text-[0.85em]"
          style={{ background: 'var(--surface-high)', color: 'var(--primary)' }}
        >
          {token.slice(1, -1)}
        </code>,
      )
    }
    last = m.index + token.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

export default function Markdown({ children, className = '' }) {
  const source = String(children || '')
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks = []

  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.trimStart().startsWith('```')) {
      const body = []
      i++
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        body.push(lines[i])
        i++
      }
      i++ // closing fence
      blocks.push(
        <pre
          key={key++}
          className="my-3 overflow-x-auto rounded-lg border p-3 font-mono text-[13px] leading-6"
          style={{
            background: 'var(--surface-lowest)',
            borderColor: 'var(--outline-variant)',
            color: 'var(--on-surface)',
          }}
        >
          {body.join('\n')}
        </pre>,
      )
      continue
    }

    // Heading
    const heading = line.match(/^(#{1,4})\s+(.*)$/)
    if (heading) {
      blocks.push(
        <h3 key={key++} className="mb-2 mt-5 text-body-lg font-semibold text-on-surface first:mt-0">
          {inline(heading[2], `h${key}`)}
        </h3>,
      )
      i++
      continue
    }

    // List (bulleted or numbered) — consume the whole run
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const items = []
      const ordered = /^\s*\d+\.\s+/.test(line)
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ''))
        i++
      }
      const List = ordered ? 'ol' : 'ul'
      blocks.push(
        <List
          key={key++}
          className={`my-2 space-y-1 pl-5 ${ordered ? 'list-decimal' : 'list-disc'}`}
          style={{ color: 'var(--on-surface-variant)' }}
        >
          {items.map((it, n) => <li key={n}>{inline(it, `li${key}-${n}`)}</li>)}
        </List>,
      )
      continue
    }

    // Blank line
    if (line.trim() === '') { i++; continue }

    // Paragraph — gather until a blank line or a block starter
    const para = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^\s*([-*]|\d+\.)\s+/.test(lines[i]) &&
      !lines[i].trimStart().startsWith('```') &&
      !/^#{1,4}\s+/.test(lines[i])
    ) {
      para.push(lines[i])
      i++
    }
    blocks.push(
      <p key={key++} className="my-2 leading-7" style={{ color: 'var(--on-surface-variant)' }}>
        {inline(para.join(' '), `p${key}`)}
      </p>,
    )
  }

  return <div className={`text-body-md ${className}`}>{blocks}</div>
}
