import MarkdownIt from 'markdown-it'
import { describe, expect, it } from 'vitest'
import MarkdownItExtraLinkRss from '../src/rss'
import { createTempPost } from './helpers/temp-post'

describe('markdown-it-extra-link/rss', () => {
  it('renders pure anchor in rss mode for github links', () => {
    const md = new MarkdownIt()
    md.use(MarkdownItExtraLinkRss, {
      baseUrl: 'https://example.com'
    })

    const html = md.renderInline('{link:github:imba97/blog-vite,My Blog}')
    expect(html).toContain('<a href="https://github.com/imba97/blog-vite"')
    expect(html).toContain('>My Blog</a>')
    expect(html).not.toContain('<span')
    expect(html).not.toContain('markdown-extra-link-inline')
  })

  it('renders absolute post href in rss mode', () => {
    const temp = createTempPost('801', 'RSS Absolute URL', true, 'markdown-it-extra-link-rss-')
    try {
      const md = new MarkdownIt()
      md.use(MarkdownItExtraLinkRss, {
        baseUrl: 'https://example.com',
        post: {
          globs: temp.globs
        }
      })

      const html = md.renderInline('{link:post:801}')
      expect(html).toContain('href="https://example.com/post/801"')
      expect(html).toContain('《RSS Absolute URL》')
      expect(html).not.toContain('markdown-extra-link-inline')
    }
    finally {
      temp.cleanup()
    }
  })

  it('throws when rss mode does not provide baseUrl', () => {
    const md = new MarkdownIt()
    expect(() => {
      md.use(MarkdownItExtraLinkRss, {} as never)
    }).toThrowError('[markdown-it-extra-link/rss] `baseUrl` is required')
  })

  it('throws when rss mode uses non-http baseUrl', () => {
    const md = new MarkdownIt()
    expect(() => {
      md.use(MarkdownItExtraLinkRss, { baseUrl: 'ftp://example.com' })
    }).toThrowError('[markdown-it-extra-link/rss] `baseUrl` must use http or https protocol')
  })

  it('keeps scheme-relative href when post path starts with double slash', () => {
    const temp = createTempPost('901', 'CDN Path Post', true, 'markdown-it-extra-link-rss-')
    try {
      const md = new MarkdownIt()
      md.use(MarkdownItExtraLinkRss, {
        baseUrl: 'https://example.com',
        post: {
          globs: temp.globs,
          path: '//cdn.example.com/post/:id'
        }
      })

      const html = md.renderInline('{link:post:901}')
      expect(html).toContain('href="//cdn.example.com/post/901"')
    }
    finally {
      temp.cleanup()
    }
  })
})
