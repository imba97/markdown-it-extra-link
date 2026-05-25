import type MarkdownIt from 'markdown-it'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'

export type MarkdownInlineStateLike = StateInline

export interface ExtraLinkMatch {
  type: string
  payload: string
  params: string[]
  raw: string
  consumedLength: number
  leadingWhitespaceLength: number
  trailingWhitespaceLength: number
}

export interface ResolvedExtraLink {
  href: string
  text: string
  classNames?: ExtraLinkResolvedClassNames
  prefixItems?: ResolvedExtraLinkPrefixItem[]
  title?: string
  target?: string
  rel?: string
}

export type ResolvedExtraLinkPrefixItem = ResolvedExtraLinkClassIconPrefixItem | ResolvedExtraLinkImageIconPrefixItem

export interface ResolvedExtraLinkClassIconPrefixItem {
  kind: 'class-icon'
  /**
   * Icon base class, usually from icon config.
   */
  className: string
  /**
   * Extra class names from style slot.
   */
  extraClassName?: string
  scale?: number
}

export interface ResolvedExtraLinkImageIconPrefixItem {
  kind: 'image-icon'
  src: string
  /**
   * Extra class names for image icon wrapper.
   */
  extraClassName?: string
  scale?: number
}

export interface ExtraLinkCommonClassNames {
  linkClass?: string
}

export type ExtraLinkClassNames<T extends object = Record<never, never>> = ExtraLinkCommonClassNames & T

export interface ExtraLinkResolvedClassNames extends ExtraLinkCommonClassNames {
  [slot: string]: string | undefined
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
  classNames?: ExtraLinkClassNames
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
   * Post index scan mode.
   * - `lazy`: scan on first resolve.
   * - `eager`: scan when link type is created.
   * @default 'lazy'
   */
  scanMode?: 'lazy' | 'eager'
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
  /**
   * Convert relative href to absolute url when provided.
   * Only applies when rendered href does not include protocol.
   */
  baseUrl?: string
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
  classNames?: ExtraLinkClassNames<{
    iconClass?: string
  }>
}

export interface MarkdownItExtraLinkOptions {
  post?: false | PostLinkOptions
  github?: false | GithubLinkOptions
  /**
   * Link rendering output mode.
   * - `enhanced`: default output with prefix/icon and contextual wrapper.
   * - `anchor`: output pure `<a>` only.
   * @default 'enhanced'
   */
  renderMode?: ExtraLinkRenderMode
  /**
   * Custom link types.
   */
  customTypes?: ExtraLink[]
}

export type ExtraLinkRenderMode = 'enhanced' | 'anchor'

export interface MarkdownItExtraLinkRssOptions extends Omit<MarkdownItExtraLinkOptions, 'post' | 'renderMode'> {
  baseUrl: string
  post?: false | Omit<PostLinkOptions, 'baseUrl'>
}
