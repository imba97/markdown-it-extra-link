import type {
  GithubIconOptions,
  GithubLinkOptions,
  ResolvedExtraLink,
  ResolvedExtraLinkPrefixItem
} from '../types'
import { AbstractLink } from '../core/abstract'

const GITHUB_ICON_DATA_URL = 'data:image/svg+xml;utf8,%3Csvg viewBox=\'0 0 24 24\' display=\'inline-block\' vertical-align=\'text-bottom\' width=\'1.2em\' height=\'1.2em\' xmlns=\'http://www.w3.org/2000/svg\' %3E%3Cpath fill=\'currentColor\' d=\'M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2\'/%3E%3C/svg%3E'

function parseRepo(repoRaw: string, aliasRaw?: string): { repo: string, alias?: string } | null {
  if (!repoRaw)
    return null

  const repo = repoRaw.replace(/^\/+|\/+$/g, '')
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo))
    return null

  return {
    repo,
    alias: aliasRaw || undefined
  }
}

function normalizeIconOption(icon: string | GithubIconOptions | undefined): GithubIconOptions {
  if (!icon)
    return { value: GITHUB_ICON_DATA_URL, asClass: false }
  if (typeof icon === 'string')
    return { value: icon, asClass: icon.startsWith('i-') }
  return {
    value: icon.value || GITHUB_ICON_DATA_URL,
    asClass: icon.asClass ?? Boolean(icon.value?.startsWith('i-'))
  }
}

function buildGithubPrefixItems(options: GithubLinkOptions): ResolvedExtraLinkPrefixItem[] {
  const icon = normalizeIconOption(options.icon)
  const scale = Number.isFinite(options.scale) ? Math.max(0.1, Number(options.scale)) : 1

  if (icon.asClass) {
    const className = icon.value || 'i-mdi-github'
    return [{
      kind: 'class-icon',
      className,
      scale
    }]
  }

  return [{
    kind: 'image-icon',
    src: icon.value || GITHUB_ICON_DATA_URL,
    scale
  }]
}

export class GithubLink extends AbstractLink {
  readonly type = 'github'
  private readonly githubOptions: GithubLinkOptions

  constructor(options: GithubLinkOptions = {}) {
    const mergedOptions: GithubLinkOptions = {
      target: '_blank',
      rel: 'noopener noreferrer',
      ...options
    }
    super(mergedOptions)
    this.githubOptions = mergedOptions
  }

  protected handle(repoRaw = '', aliasRaw = ''): ResolvedExtraLink | null {
    const parsed = parseRepo(repoRaw.trim(), aliasRaw.trim())
    if (!parsed)
      return null

    const options = this.githubOptions
    return {
      href: `https://github.com/${parsed.repo}`,
      text: parsed.alias || parsed.repo,
      classList: ['markdown-extra-link-github'],
      prefixItems: buildGithubPrefixItems(options)
    }
  }
}

export { GITHUB_ICON_DATA_URL }
