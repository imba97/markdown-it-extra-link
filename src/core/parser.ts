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
import { mergeClassName } from './class-name'

const reCapture = /^[ \t]*\{link:([a-z][\w-]*):([^{}\n]+)\}[ \t]*/i
const AUTO_INLINE_GAP_EM = 0.25

function splitExtraLinkParams(payload: string): string[] {
  const params: string[] = []
  let current = ''

  for (let i = 0; i < payload.length; i += 1) {
    const char = payload[i]
    const next = payload[i + 1]
    if (char === '\\' && (next === ',' || next === '\\')) {
      current += next
      i += 1
      continue
    }
    if (char === ',') {
      params.push(current.trim())
      current = ''
      continue
    }
    current += char
  }

  params.push(current.trim())
  return params
}

function isTextChar(char: string | undefined): boolean {
  if (!char)
    return false
  return /[\p{L}\p{N}]/u.test(char)
}

function findTokenStart(source: string, position: number): number {
  const current = source[position]
  if (current === '{')
    return position
  if (current !== ' ' && current !== '\t')
    return -1

  let tokenStart = position
  while (tokenStart < source.length) {
    const char = source[tokenStart]
    if (char !== ' ' && char !== '\t')
      break
    tokenStart += 1
  }
  return source[tokenStart] === '{' ? tokenStart : -1
}

function mayBeExtraLink(source: string, position: number): boolean {
  const tokenStart = findTokenStart(source, position)
  if (tokenStart < 0)
    return false
  return source
    .slice(tokenStart, tokenStart + '{link:'.length)
    .toLowerCase() === '{link:'
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

export function parseExtraLink(source: string): ExtraLinkMatch | null {
  const matched = source.match(reCapture)
  if (!matched)
    return null

  const [raw, type, payload] = matched
  const leadingWhitespaceLength = raw.match(/^[ \t]*/)?.[0]?.length || 0
  const trailingWhitespaceLength = raw.match(/[ \t]*$/)?.[0]?.length || 0
  return {
    type: type.toLowerCase(),
    payload: payload.trim(),
    params: splitExtraLinkParams(payload.trim()),
    raw,
    consumedLength: raw.length,
    leadingWhitespaceLength,
    trailingWhitespaceLength
  }
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

  return (state: MarkdownInlineStateLike, silent: boolean) => {
    if (!mayBeExtraLink(state.src, state.pos))
      return false

    const starts = state.src.slice(state.pos)
    const parsed = parseExtraLink(starts)
    if (!parsed)
      return false

    const matchedType = typeMap.get(parsed.type)
    const resolved = matchedType?.resolve(parsed, { md, state, options })

    if (!resolved)
      return false

    if (!silent) {
      const tokenStart = state.pos + parsed.leadingWhitespaceLength
      const tokenEnd = state.pos + parsed.consumedLength - parsed.trailingWhitespaceLength
      const hasTextBefore = isTextChar(findPrevNonSpaceChar(state.src, tokenStart - 1))
      const hasTextAfter = isTextChar(findNextNonSpaceChar(state.src, tokenEnd))
      if (state.pending)
        state.pending = state.pending.replace(/[ \t]+$/g, '')
      const token = state.push('html_inline', '', 0)
      token.content = renderResolved(resolved, { hasTextBefore, hasTextAfter })
    }

    state.pos += parsed.consumedLength
    return true
  }
}
