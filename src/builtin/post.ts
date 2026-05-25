import type {
  PostLinkFormatterPayload,
  PostLinkMap,
  PostLinkOptions,
  ResolvedExtraLink
} from '../types'
import { readFileSync } from 'node:fs'
import matter from 'gray-matter'
import { globSync } from 'tinyglobby'
import { AbstractLink } from '../core/abstract'

function normalizeId(value: unknown): string {
  return String(value ?? '').trim()
}

function createMapFromGlobs(options: PostLinkOptions): PostLinkMap {
  const globs = options.globs
    ? (Array.isArray(options.globs) ? options.globs : [options.globs])
    : ['posts/**/index.md']
  const files = globSync(globs, { absolute: true })
  const map: PostLinkMap = {}

  for (const filePath of files) {
    const source = readFileSync(filePath, 'utf-8')
    const { data } = matter(source)
    const frontmatter = (data && typeof data === 'object') ? data as Record<string, unknown> : {}
    const id = normalizeId(frontmatter.id)
    const title = normalizeId(frontmatter.title)
    if (!id || !title)
      continue

    map[id] = {
      id,
      title,
      filePath,
      frontmatter
    }
  }

  return map
}

function resolveTemplate(template: string, params: Record<string, unknown>): string {
  return template.replace(/:([a-z_][\w-]*)/gi, (_, key: string) => {
    const value = params[key]
    return encodeURIComponent(String(value ?? ''))
  })
}

function toAbsoluteHref(href: string, baseUrl?: string): string {
  if (!baseUrl || href.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(href))
    return href
  return new URL(href, baseUrl).toString()
}

export class PostLink extends AbstractLink {
  readonly type = 'post'
  private readonly postOptions: PostLinkOptions
  private readonly scanMode: 'lazy' | 'eager'
  private postMap: PostLinkMap | null

  constructor(options: PostLinkOptions = {}) {
    super(options)
    this.postOptions = options
    this.scanMode = options.scanMode || 'lazy'
    if (options.globs === false) {
      this.postMap = {}
      return
    }
    this.postMap = this.scanMode === 'eager'
      ? createMapFromGlobs(this.postOptions)
      : null
  }

  refresh(): void {
    this.postMap = this.postOptions.globs === false ? {} : createMapFromGlobs(this.postOptions)
  }

  private getPostMap(): PostLinkMap {
    if (!this.postMap)
      this.refresh()
    return this.postMap || {}
  }

  protected handle(id = '', alias = ''): ResolvedExtraLink | null {
    const options = this.postOptions
    const pathTemplate = options.path || '/post/:id'
    const postId = normalizeId(id)
    if (!postId)
      return null
    const current = this.getPostMap()[postId]
    const payload: PostLinkFormatterPayload = {
      id: postId,
      title: current?.title || postId,
      filePath: current?.filePath || '',
      frontmatter: current?.frontmatter || {}
    }
    const customParams = options.formatter?.(payload) || {}
    const params = {
      id: payload.id,
      title: payload.title,
      ...customParams
    }
    const href = resolveTemplate(pathTemplate, params)
    const resolvedHref = toAbsoluteHref(href, options.baseUrl)
    const text = alias || `《${payload.title}》`

    return {
      href: resolvedHref,
      text
    }
  }
}
