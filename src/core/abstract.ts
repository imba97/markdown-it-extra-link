import type { ExtraLink, ExtraLinkMatch, ExtraLinkResolverContext, ExtraLinkTypeCommonOptions, ResolvedExtraLink } from '../types'

export abstract class AbstractLink implements ExtraLink {
  protected readonly config: ExtraLinkTypeCommonOptions

  constructor(config: ExtraLinkTypeCommonOptions = {}) {
    this.config = config
  }

  abstract readonly type: string

  resolve(match: ExtraLinkMatch, _context: ExtraLinkResolverContext): ResolvedExtraLink | null | undefined {
    const resolved = this.handle(match.payload, ...match.params)
    if (!resolved)
      return resolved
    return this.withCommonConfig(resolved)
  }

  protected abstract handle(raw: string, ...params: string[]): ResolvedExtraLink | null | undefined

  protected withCommonConfig(link: ResolvedExtraLink): ResolvedExtraLink {
    return {
      ...link,
      target: link.target || this.config.target,
      rel: link.rel || this.config.rel
    }
  }
}
