import type MarkdownIt from 'markdown-it'
import type { RuleInline } from 'markdown-it/lib/parser_inline.mjs'
import type { ExtraLink, ExtraLinkMatch, MarkdownInlineStateLike, MarkdownItExtraLinkOptions, ResolvedExtraLink } from '../types'

const reCapture = /^[ \t]*\{link:([a-z][\w-]*):([^{}\n]+)\}[ \t]*/i

function splitExtraLinkParams(payload: string): string[] {
  return payload.split(',').map(i => i.trim())
}

export function parseExtraLink(source: string): ExtraLinkMatch | null {
  const matched = source.match(reCapture)
  if (!matched)
    return null

  const [raw, type, payload] = matched
  return {
    type: type.toLowerCase(),
    payload: payload.trim(),
    params: splitExtraLinkParams(payload.trim()),
    raw,
    consumedLength: raw.length
  }
}

export function renderResolvedExtraLink(
  md: MarkdownIt,
  resolved: ResolvedExtraLink
): string {
  const href = md.normalizeLink(resolved.href)
  const text = md.utils.escapeHtml(resolved.text)
  const classes = ['markdown-extra-link', ...(resolved.classList || [])]
  const classAttr = classes.length ? ` class="${md.utils.escapeHtml(classes.join(' '))}"` : ''
  const titleAttr = resolved.title
    ? ` title="${md.utils.escapeHtml(resolved.title)}"`
    : ''
  const targetAttr = resolved.target
    ? ` target="${md.utils.escapeHtml(resolved.target)}"`
    : ''
  const relValue = resolved.rel || (resolved.target === '_blank' ? 'noopener noreferrer' : '')
  const relAttr = relValue
    ? ` rel="${md.utils.escapeHtml(relValue)}"`
    : ''
  const prefix = resolved.prefixHtml || ''
  return `${prefix}<a href="${md.utils.escapeHtml(href)}"${classAttr}${titleAttr}${targetAttr}${relAttr}>${text}</a>`
}

export function createExtraLinkRule(
  md: MarkdownIt,
  options: MarkdownItExtraLinkOptions,
  types: ExtraLink[]
): RuleInline {
  return (state: MarkdownInlineStateLike, silent: boolean) => {
    const current = state.src.charCodeAt(state.pos)
    const isOpenBrace = current === '{'.charCodeAt(0)
    const isWhitespace = current === ' '.charCodeAt(0) || current === '\t'.charCodeAt(0)
    if (!isOpenBrace && !isWhitespace)
      return false

    const starts = state.src.slice(state.pos)
    const parsed = parseExtraLink(starts)
    if (!parsed)
      return false

    let resolved: ResolvedExtraLink | null | undefined
    for (const type of types) {
      if (type.type !== parsed.type)
        continue
      resolved = type.resolve(parsed, { md, state, options })
      if (resolved)
        break
    }

    if (!resolved)
      return false

    if (!silent) {
      if (state.pending)
        state.pending = state.pending.replace(/[ \t]+$/g, '')
      const token = state.push('html_inline', '', 0)
      token.content = renderResolvedExtraLink(md, resolved)
    }

    state.pos += parsed.consumedLength
    return true
  }
}
