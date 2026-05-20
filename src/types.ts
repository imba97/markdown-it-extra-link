import type MarkdownIt from 'markdown-it'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'

export type MarkdownInlineStateLike = StateInline

export interface ExtraLinkMatch {
  type: string
  payload: string
  params: string[]
  raw: string
  consumedLength: number
}

export interface ResolvedExtraLink {
  href: string
  text: string
  classList?: string[]
  prefixHtml?: string
  title?: string
  target?: string
  rel?: string
}

export interface ExtraLinkResolverContext {
  md: MarkdownIt
  state: MarkdownInlineStateLike
  options: MarkdownItExtraLinkOptions
}

export interface ExtraLink {
  type: string
  resolve: (match: ExtraLinkMatch, context: ExtraLinkResolverContext) => ResolvedExtraLink | null | undefined
}

export interface PostLinkRecord {
  id: string
  title: string
  filePath: string
  frontmatter: Record<string, unknown>
}

export type PostLinkMap = Record<string, PostLinkRecord>

export interface PostLinkFormatterPayload {
  id: string
  title: string
  filePath: string
  frontmatter: Record<string, unknown>
}

export interface ExtraLinkTypeCommonOptions {
  target?: string
  rel?: string
}

export interface PostLinkOptions extends ExtraLinkTypeCommonOptions {
  /**
   * Glob patterns for automatic posts scan.
   * Relative path uses current working directory.
   * Set to false to disable auto scan.
   * @default 'posts/**\/index.md'
   */
  globs?: string | string[] | false
  /**
   * Href template with `:key` placeholders.
   * @default '/post/:id'
   */
  path?: string
  /**
   * Build placeholder params for path.
   * Return values will replace `:key` in path.
   */
  formatter?: (payload: PostLinkFormatterPayload) => Record<string, unknown>
}

export interface GithubIconOptions {
  /**
   * UnoCSS class (e.g. i-mdi-github) or image url.
   */
  value?: string
  /**
   * true means icon string is className, false means url.
   */
  asClass?: boolean
}

export interface GithubLinkOptions extends ExtraLinkTypeCommonOptions {
  /**
   * Icon scale multiplier.
   * @default 1
   */
  scale?: number
  /**
   * Icon config, defaults to built-in svg data url.
   */
  icon?: string | GithubIconOptions
}

export interface MarkdownItExtraLinkOptions {
  post?: false | PostLinkOptions
  github?: false | GithubLinkOptions
  /**
   * Custom link types.
   */
  customTypes?: ExtraLink[]
}
