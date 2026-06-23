import type { MagicMarkMatch } from 'magic-mark'
import type MarkdownIt from 'markdown-it'
import type { RuleInline } from 'markdown-it/lib/parser_inline.mjs'
import type {
  ExtraLink,
  ExtraLinkMatch,
  MarkdownInlineStateLike,
  MarkdownItExtraLinkOptions,
  ResolvedExtraLink,
  ResolvedExtraLinkPrefixItem
} from '../types'
import { createMagicMark } from 'magic-mark'
import { mergeClassName } from './class-name'

const LINK_ID = 'link'
const LINK_PREFIX = `{${LINK_ID}:`
const linkMark = createMagicMark({ id: LINK_ID })

const AUTO_INLINE_GAP_EM = 0.25
const TRAILING_WHITESPACE_RE = /[ \t]+$/

function isTextChar(char: string | undefined): boolean {
  if (!char)
    return false
  return /[\p{L}\p{N}]/u.test(char)
}

function findPrevNonSpaceChar(source: string, index: number): string | undefined {
  for (let i = index; i >= 0; i -= 1) {
    const char = source[i]
    if (char !== ' ' && char !== '\t')
      return char
  }
  return undefined
}

function findNextNonSpaceChar(source: string, index: number): string | undefined {
  for (let i = index; i < source.length; i += 1) {
    const char = source[i]
    if (char !== ' ' && char !== '\t')
      return char
  }
  return undefined
}

function renderPrefixItems(md: MarkdownIt, items: ResolvedExtraLinkPrefixItem[] = []): string {
  if (!items.length)
    return ''

  return items.map((item) => {
    const scale = Number.isFinite(item.scale) ? Math.max(0.1, Number(item.scale)) : 1
    const size = `${1.2 * scale}em`
    const baseStyle = `display:inline-block;vertical-align:text-bottom;width:${size};height:${size};margin-right:0.3em;`

    if (item.kind === 'class-icon') {
      const className = mergeClassName(item.className, item.extraClassName)
      const classAttr = className ? ` class="${md.utils.escapeHtml(className)}"` : ''
      return `<span${classAttr} style="${baseStyle}"></span>`
    }

    const safeSrc = item.src
      .replaceAll('"', '%22')
      .replaceAll('\'', '%27')
    const style = `${baseStyle}background-image:url("${safeSrc}");background-size:contain;background-repeat:no-repeat;background-position:center;`
    const className = mergeClassName(item.extraClassName)
    const classAttr = className ? ` class="${md.utils.escapeHtml(className)}"` : ''
    return `<span${classAttr} style="${md.utils.escapeHtml(style)}"></span>`
  }).join('')
}

function renderLinkAnchor(
  md: MarkdownIt,
  resolved: ResolvedExtraLink,
  extraClassName?: string
): string {
  const href = md.normalizeLink(resolved.href)
  const text = md.utils.escapeHtml(resolved.text)
  const className = mergeClassName(
    extraClassName,
    resolved.classNames?.linkClass
  )
  const classAttr = className ? ` class="${md.utils.escapeHtml(className)}"` : ''
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

  return `<a href="${md.utils.escapeHtml(href)}"${classAttr}${titleAttr}${targetAttr}${relAttr}>${text}</a>`
}

export function renderResolvedExtraLink(
  md: MarkdownIt,
  resolved: ResolvedExtraLink,
  context?: { hasTextBefore: boolean, hasTextAfter: boolean }
): string {
  const link = renderLinkAnchor(md, resolved, 'markdown-extra-link')
  const prefix = renderPrefixItems(md, resolved.prefixItems)
  const content = `${prefix}${link}`
  const hasTextBefore = Boolean(context?.hasTextBefore)
  const hasTextAfter = Boolean(context?.hasTextAfter)
  if (!hasTextBefore && !hasTextAfter)
    return content

  const style = `${hasTextBefore ? `margin-left:${AUTO_INLINE_GAP_EM}em;` : ''}${hasTextAfter ? `margin-right:${AUTO_INLINE_GAP_EM}em;` : ''}`
  return `<span class="markdown-extra-link-inline" style="${md.utils.escapeHtml(style)}">${content}</span>`
}

export function renderResolvedExtraLinkAnchor(md: MarkdownIt, resolved: ResolvedExtraLink): string {
  return renderLinkAnchor(md, resolved)
}

export function createExtraLinkRule(
  md: MarkdownIt,
  options: MarkdownItExtraLinkOptions,
  types: ExtraLink[]
): RuleInline {
  const typeMap = new Map(types.map(type => [type.type, type]))
  const renderResolved = options.renderMode === 'anchor'
    ? (resolved: ResolvedExtraLink) => renderResolvedExtraLinkAnchor(md, resolved)
    : (
        resolved: ResolvedExtraLink,
        context?: { hasTextBefore: boolean, hasTextAfter: boolean }
      ) => renderResolvedExtraLink(md, resolved, context)

  // `magic-mark` walks the source on every `parse()` call (it rebuilds its
  // regex defensively), so caching turns a quadratic inline rule into a
  // linear one. Cache invalidates automatically when the source changes.
  let parseCache: { src: string, matches: MagicMarkMatch[] } | null = null

  return (state: MarkdownInlineStateLike, silent: boolean) => {
    const src = state.src
    if (!parseCache || parseCache.src !== src)
      parseCache = { src, matches: linkMark.parse(src) }

    // Cursor must land exactly on `{`. Leading whitespace is absorbed by
    // markdown-it's text rule into `state.pending`; we trim that below so
    // the link sits flush against surrounding text.
    const cursor = state.pos
    const match = parseCache.matches.find(m => !m.escaped && m.start === cursor)
    if (!match)
      return false

    // Consume any horizontal whitespace after the closing `}` so the
    // surrounding text doesn't pick it up.
    let trailingWhitespaceLength = 0
    while (match.end + trailingWhitespaceLength < src.length) {
      const ch = src[match.end + trailingWhitespaceLength]
      if (ch !== ' ' && ch !== '\t')
        break
      trailingWhitespaceLength += 1
    }
    const consumedLength = match.raw.length + trailingWhitespaceLength

    // Reconstruct the source-form payload (text between the second `:` and
    // the closing `}`) for resolvers that read `match.payload`.
    const afterType = LINK_PREFIX.length + match.type.length
    const secondColon = match.raw.indexOf(':', afterType)
    const payload = secondColon >= 0 ? match.raw.slice(secondColon + 1, -1) : ''

    const matched: ExtraLinkMatch = {
      type: match.type,
      payload,
      params: match.params,
      raw: src.slice(cursor, cursor + consumedLength),
      consumedLength,
      leadingWhitespaceLength: 0,
      trailingWhitespaceLength
    }

    const resolved = typeMap.get(matched.type)?.resolve(matched, { md, state, options })
    if (!resolved)
      return false

    if (!silent) {
      const tokenStart = match.start
      const tokenEnd = match.end
      const hasTextBefore = isTextChar(findPrevNonSpaceChar(src, tokenStart - 1))
      const hasTextAfter = isTextChar(findNextNonSpaceChar(src, tokenEnd))
      if (state.pending)
        state.pending = state.pending.replace(TRAILING_WHITESPACE_RE, '')
      const token = state.push('html_inline', '', 0)
      token.content = renderResolved(resolved, { hasTextBefore, hasTextAfter })
    }

    state.pos += consumedLength
    return true
  }
}
