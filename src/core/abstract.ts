import type {
  ExtraLink,
  ExtraLinkClassNames,
  ExtraLinkMatch,
  ExtraLinkResolvedClassNames,
  ExtraLinkResolverContext,
  ExtraLinkTypeCommonOptions,
  ResolvedExtraLink
} from '../types'
import { mergeClassNameRecords } from './class-name'

function mergeClassNames(
  base?: ExtraLinkClassNames,
  extra?: ExtraLinkResolvedClassNames
): ExtraLinkResolvedClassNames | undefined {
  return mergeClassNameRecords(
    (base || {}) as Record<string, unknown>,
    (extra || {}) as Record<string, unknown>
  ) as ExtraLinkResolvedClassNames | undefined
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
