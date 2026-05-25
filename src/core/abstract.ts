import type {
  ExtraLink,
  ExtraLinkClassNames,
  ExtraLinkMatch,
  ExtraLinkResolvedClassNames,
  ExtraLinkResolverContext,
  ExtraLinkTypeCommonOptions,
  ResolvedExtraLink
} from '../types'

function normalizeClassName(value?: string): string[] {
  if (!value)
    return []
  return value
    .split(/\s+/)
    .map(item => item.trim())
    .filter(Boolean)
}

function mergeClassNames(
  base?: ExtraLinkClassNames,
  extra?: ExtraLinkResolvedClassNames
): ExtraLinkResolvedClassNames | undefined {
  const baseRecord = (base || {}) as Record<string, unknown>
  const extraRecord = (extra || {}) as Record<string, unknown>
  const slots = new Set<string>([
    ...Object.keys(baseRecord),
    ...Object.keys(extraRecord)
  ])
  if (!slots.size)
    return undefined

  const merged: ExtraLinkResolvedClassNames = {}
  for (const slot of slots) {
    const classSet = new Set<string>([
      ...normalizeClassName(typeof baseRecord[slot] === 'string' ? baseRecord[slot] : undefined),
      ...normalizeClassName(typeof extraRecord[slot] === 'string' ? extraRecord[slot] : undefined)
    ])
    if (classSet.size)
      merged[slot] = Array.from(classSet).join(' ')
  }
  return Object.keys(merged).length ? merged : undefined
}

export abstract class AbstractLink implements ExtraLink {
  protected readonly config: ExtraLinkTypeCommonOptions

  constructor(config: ExtraLinkTypeCommonOptions = {}) {
    this.config = config
  }

  abstract readonly type: string

  resolve(match: ExtraLinkMatch, _context: ExtraLinkResolverContext): ResolvedExtraLink | null | undefined {
    const resolved = this.handle(...match.params)
    if (!resolved)
      return resolved
    return this.withCommonConfig(resolved)
  }

  protected abstract handle(...params: string[]): ResolvedExtraLink | null | undefined

  protected withCommonConfig(link: ResolvedExtraLink): ResolvedExtraLink {
    return {
      ...link,
      target: link.target || this.config.target,
      rel: link.rel || this.config.rel,
      classNames: mergeClassNames(
        {
          linkClass: `markdown-extra-link-${this.type}`
        },
        mergeClassNames(this.config.classNames, link.classNames)
      )
    }
  }
}
