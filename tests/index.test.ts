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
  function createTempPost(id: string, title: string, writeImmediately = true) {
    const root = mkdtempSync(path.join(tmpdir(), 'markdown-it-extra-link-'))
    const postDir = path.join(root, 'posts', 'hello-world')
    const markdownFile = path.join(postDir, 'index.md')

    function writePost(postId = id, postTitle = title) {
      mkdirSync(postDir, { recursive: true })
      writeFileSync(markdownFile, `---
id: ${postId}
title: ${postTitle}
---
`, { encoding: 'utf-8' })
    }

    if (writeImmediately)
      writePost()

    return {
      cleanup: () => rmSync(root, { force: true, recursive: true }),
      globs: `${root.replaceAll('\\', '/')}/posts/**/index.md`,
      writePost
    }
  }

  function withTempPost(id: string, title: string, run: (temp: ReturnType<typeof createTempPost>) => void) {
    const temp = createTempPost(id, title)
    try {
      run(temp)
    }
    finally {
      temp.cleanup()
    }
  }

  it('renders post link from auto scanned posts', () => {
    withTempPost('734', 'WordPress 迁移至 Hexo', (temp) => {
      const md = new MarkdownIt()
      md.use(MarkdownItExtraLink, {
        post: {
          globs: temp.globs
        }
      })

      const html = md.renderInline('{link:post:734}')
      expect(html).toContain('href="/post/734"')
      expect(html).toContain('《WordPress 迁移至 Hexo》')
    })
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

  it('supports classNames.linkClass for github link element', () => {
    const md = new MarkdownIt()
    md.use(MarkdownItExtraLink, {
      github: {
        classNames: {
          linkClass: 'text-blue-500 font-bold'
        }
      }
    })

    const html = md.renderInline('{link:github:imba97/blog-vite}')
    expect(html).toContain('class="markdown-extra-link markdown-extra-link-github text-blue-500 font-bold"')
  })

  it('supports classNames.iconClass for github image icon', () => {
    const md = new MarkdownIt()
    md.use(MarkdownItExtraLink, {
      github: {
        classNames: {
          iconClass: 'mr-1 text-gray-500'
        }
      }
    })

    const html = md.renderInline('{link:github:imba97/blog-vite}')
    expect(html).toContain('<span class="mr-1 text-gray-500" style="display:inline-block;')
  })

  it('supports classNames.iconClass for github class icon', () => {
    const md = new MarkdownIt()
    md.use(MarkdownItExtraLink, {
      github: {
        icon: 'i-mdi-github',
        classNames: {
          iconClass: 'mr-2 text-gray-600'
        }
      }
    })

    const html = md.renderInline('{link:github:imba97/blog-vite}')
    expect(html).toContain('<span class="i-mdi-github mr-2 text-gray-600" style="display:inline-block;')
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
    withTempPost('734', 'WordPress 迁移至 Hexo', (temp) => {
      const md = new MarkdownIt()
      md.use(MarkdownItExtraLink, {
        post: {
          globs: temp.globs
        }
      })

      const html = md.renderInline('我将博客从 {link:post:734} 并阐述了一些原因')
      expect(html).toContain('我将博客从<span class="markdown-extra-link-inline" style="margin-left:0.25em;margin-right:0.25em;"><a')
      expect(html).toContain('</a></span>并阐述了一些原因')
      expect(html).not.toContain('从 <span')
      expect(html).not.toContain('</span> 并')
    })
  })

  it('supports path and formatter placeholders', () => {
    withTempPost('734', 'WordPress 迁移至 Hexo', (temp) => {
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
    })
  })

  it('supports post alias without title brackets', () => {
    withTempPost('122', '原始标题', (temp) => {
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
    })
  })

  it('supports classNames.linkClass for post link element', () => {
    withTempPost('122', '原始标题', (temp) => {
      const md = new MarkdownIt()
      md.use(MarkdownItExtraLink, {
        post: {
          globs: temp.globs,
          classNames: {
            linkClass: 'text-primary hover:underline'
          }
        }
      })

      const html = md.renderInline('{link:post:122}')
      expect(html).toContain('class="markdown-extra-link markdown-extra-link-post text-primary hover:underline"')
    })
  })

  it('supports escaped comma in alias', () => {
    const md = new MarkdownIt()
    md.use(MarkdownItExtraLink)

    const html = md.renderInline('{link:github:imba97/blog-vite,My\\, Blog}')
    expect(html).toContain('>My, Blog</a>')
  })

  it('scans post files lazily on first resolve', () => {
    const temp = createTempPost('301', 'Lazy Post', false)
    try {
      const md = new MarkdownIt()
      md.use(MarkdownItExtraLink, {
        post: {
          globs: temp.globs
        }
      })

      temp.writePost()
      const html = md.renderInline('{link:post:301}')
      expect(html).toContain('href="/post/301"')
      expect(html).toContain('《Lazy Post》')
    }
    finally {
      temp.cleanup()
    }
  })

  it('does not apply left margin when no left text', () => {
    withTempPost('401', 'Only Right Context', (temp) => {
      const md = new MarkdownIt()
      md.use(MarkdownItExtraLink, {
        post: { globs: temp.globs }
      })

      const html = md.renderInline('{link:post:401}右侧')
      expect(html).toContain('style="margin-right:0.25em;"')
      expect(html).not.toContain('margin-left:0.25em;')
    })
  })

  it('does not apply right margin when no right text', () => {
    withTempPost('402', 'Only Left Context', (temp) => {
      const md = new MarkdownIt()
      md.use(MarkdownItExtraLink, {
        post: { globs: temp.globs }
      })

      const html = md.renderInline('左侧{link:post:402}')
      expect(html).toContain('style="margin-left:0.25em;"')
      expect(html).not.toContain('margin-right:0.25em;')
    })
  })

  it('does not apply auto margins without surrounding text', () => {
    withTempPost('403', 'No Surrounding Text', (temp) => {
      const md = new MarkdownIt()
      md.use(MarkdownItExtraLink, {
        post: { globs: temp.globs }
      })

      const html = md.renderInline('{link:post:403}')
      expect(html).not.toContain('markdown-extra-link-inline')
      expect(html).toContain('<a href="/post/403"')
    })
  })
})
