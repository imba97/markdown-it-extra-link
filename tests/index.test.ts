import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import MarkdownIt from 'markdown-it'
import { describe, expect, it } from 'vitest'
import MarkdownItExtraLink from '../src'
import { AbstractLink } from '../src/core/abstract'

class DemoLinkType extends AbstractLink {
  readonly type = 'demo'

  protected handle(value = '') {
    return {
      href: `https://demo.local/${value}`,
      text: `demo:${value}`
    }
  }
}

describe('markdown-it-extra-link', () => {
  function createTempPost(id: string, title: string) {
    const root = mkdtempSync(path.join(tmpdir(), 'markdown-it-extra-link-'))
    const postDir = path.join(root, 'posts', 'hello-world')
    const markdownFile = path.join(postDir, 'index.md')
    mkdirSync(postDir, { recursive: true })
    writeFileSync(markdownFile, `---
id: ${id}
title: ${title}
---
`, { encoding: 'utf-8' })
    return {
      cleanup: () => rmSync(root, { force: true, recursive: true }),
      globs: `${root.replaceAll('\\', '/')}/posts/**/index.md`
    }
  }

  it('renders post link from auto scanned posts', () => {
    const temp = createTempPost('734', 'WordPress 迁移至 Hexo')
    const md = new MarkdownIt()
    md.use(MarkdownItExtraLink, {
      post: {
        globs: temp.globs
      }
    })

    const html = md.renderInline('{link:post:734}')
    expect(html).toContain('href="/post/734"')
    expect(html).toContain('《WordPress 迁移至 Hexo》')
    temp.cleanup()
  })

  it('renders github link with alias', () => {
    const md = new MarkdownIt()
    md.use(MarkdownItExtraLink)

    const html = md.renderInline('{link:github:imba97/blog-vite,My Blog}')
    expect(html).toContain('https://github.com/imba97/blog-vite')
    expect(html).toContain('My Blog')
    expect(html).toContain('<span')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('supports github target override config', () => {
    const md = new MarkdownIt()
    md.use(MarkdownItExtraLink, {
      github: {
        target: '_self',
        rel: 'noopener'
      }
    })

    const html = md.renderInline('{link:github:imba97/blog-vite}')
    expect(html).toContain('target="_self"')
    expect(html).toContain('rel="noopener"')
  })

  it('keeps plain text for unknown types', () => {
    const md = new MarkdownIt()
    md.use(MarkdownItExtraLink)

    const html = md.renderInline('{link:unknown:foo}')
    expect(html).toBe('{link:unknown:foo}')
  })

  it('supports custom link type', () => {
    const md = new MarkdownIt()
    md.use(MarkdownItExtraLink, {
      customTypes: [new DemoLinkType()]
    })

    const html = md.renderInline('{link:demo:abc}')
    expect(html).toContain('https://demo.local/abc')
    expect(html).toContain('demo:abc')
  })

  it('trims surrounding spaces around token', () => {
    const temp = createTempPost('734', 'WordPress 迁移至 Hexo')
    const md = new MarkdownIt()
    md.use(MarkdownItExtraLink, {
      post: {
        globs: temp.globs
      }
    })

    const html = md.renderInline('我将博客从 {link:post:734} 并阐述了一些原因')
    expect(html).toContain('我将博客从<a')
    expect(html).toContain('</a>并阐述了一些原因')
    expect(html).not.toContain('从 <a')
    expect(html).not.toContain('</a> 并')
    temp.cleanup()
  })

  it('supports path and formatter placeholders', () => {
    const temp = createTempPost('734', 'WordPress 迁移至 Hexo')
    const md = new MarkdownIt()
    md.use(MarkdownItExtraLink, {
      post: {
        globs: temp.globs,
        path: '/article/:id/:slug',
        formatter(payload) {
          return {
            slug: payload.title.toLowerCase().replaceAll(' ', '-')
          }
        }
      }
    })

    const html = md.renderInline('{link:post:734}')
    expect(html).toContain('href="/article/734/wordpress-%E8%BF%81%E7%A7%BB%E8%87%B3-hexo"')
    expect(html).toContain('《WordPress 迁移至 Hexo》')
    temp.cleanup()
  })

  it('supports post alias without title brackets', () => {
    const temp = createTempPost('122', '原始标题')
    const md = new MarkdownIt()
    md.use(MarkdownItExtraLink, {
      post: {
        globs: temp.globs
      }
    })

    const html = md.renderInline('{link:post:122,文章别名}')
    expect(html).toContain('href="/post/122"')
    expect(html).toContain('>文章别名</a>')
    expect(html).not.toContain('《文章别名》')
    temp.cleanup()
  })
})
