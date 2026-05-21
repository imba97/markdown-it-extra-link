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

export class PostLink extends AbstractLink {
  readonly type = 'post'
  private readonly postOptions: PostLinkOptions
  private postMap: PostLinkMap | null

  constructor(options: PostLinkOptions = {}) {
    super(options)
    this.postOptions = options
    this.postMap = options.globs === false ? {} : null
  }

  refresh(): void {
    this.postMap = this.postOptions.globs === false ? {} : createMapFromGlobs(this.postOptions)
  }

  private getPostMap(): PostLinkMap {
    if (!this.postMap)
      this.refresh()
    return this.postMap || {}
  }

  protected handle(id = '', alias = ''): ResolvedExtraLink {
    const options = this.postOptions
    const pathTemplate = options.path || '/post/:id'
    const postId = normalizeId(id)
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
    const text = alias || `《${payload.title}》`

    return {
      href,
      text,
      classList: ['markdown-extra-link-post']
    }
  }
}
