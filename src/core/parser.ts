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

const reCapture = /^[ \t]*\{link:([a-z][\w-]*):([^{}\n]+)\}[ \t]*/i

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

function normalizeClassName(value?: string): string[] {
  if (!value)
    return []
  return value
    .split(/\s+/)
    .map(item => item.trim())
    .filter(Boolean)
}

function mergeClassName(...values: Array<string | undefined>): string {
  const merged = new Set<string>()
  for (const value of values) {
    for (const item of normalizeClassName(value))
      merged.add(item)
  }
  return Array.from(merged).join(' ')
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
  const className = mergeClassName(
    'markdown-extra-link',
    resolved.classNames?.linkClass
  )
  const classes = className ? [className] : []
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
  const prefix = renderPrefixItems(md, resolved.prefixItems)
  return `${prefix}<a href="${md.utils.escapeHtml(href)}"${classAttr}${titleAttr}${targetAttr}${relAttr}>${text}</a>`
}

export function createExtraLinkRule(
  md: MarkdownIt,
  options: MarkdownItExtraLinkOptions,
  types: ExtraLink[]
): RuleInline {
  const typeMap = new Map(types.map(type => [type.type, type]))

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

    const matchedType = typeMap.get(parsed.type)
    const resolved = matchedType?.resolve(parsed, { md, state, options })

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
