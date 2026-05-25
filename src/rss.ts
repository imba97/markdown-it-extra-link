import type MarkdownIt from 'markdown-it'
import type {
  MarkdownItExtraLinkOptions,
  MarkdownItExtraLinkRssOptions
} from './types'
import MarkdownItExtraLink from './markdown-it-extra-link'

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed)
    throw new Error('[markdown-it-extra-link/rss] `baseUrl` is required')

  let url: URL
  try {
    url = new URL(trimmed)
  }
  catch {
    throw new Error('[markdown-it-extra-link/rss] `baseUrl` must be a valid absolute http(s) URL')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:')
    throw new Error('[markdown-it-extra-link/rss] `baseUrl` must use http or https protocol')

  if (!url.pathname.endsWith('/'))
    url.pathname = `${url.pathname}/`

  return url.toString()
}

export default function MarkdownItExtraLinkRss(
  md: MarkdownIt,
  options: MarkdownItExtraLinkRssOptions
) {
  const baseUrl = normalizeBaseUrl(options?.baseUrl || '')
  const postOptions = options.post === false
    ? false
    : {
        ...(typeof options.post === 'object' ? options.post : {}),
        baseUrl
      }

  const normalized: MarkdownItExtraLinkOptions = {
    github: options.github,
    customTypes: options.customTypes,
    post: postOptions,
    renderMode: 'anchor'
  }

  MarkdownItExtraLink(md, normalized)
}
