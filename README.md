# markdown-it-extra-link

`markdown-it` plugin for typed inline links:

- `{link:post:734}`
- `{link:github:imba97/blog-vite}`
- `{link:github:imba97/blog-vite,My Blog}`

## Install

```bash
pnpm add markdown-it-extra-link
```

## Usage

```ts
import MarkdownIt from 'markdown-it'
import MarkdownItExtraLink from 'markdown-it-extra-link'

const md = new MarkdownIt()

md.use(MarkdownItExtraLink, {
  post: {
    // default is 'posts/**/index.md'
    globs: 'posts/**/index.md',
    path: '/post/:id',
    classNames: {
      linkClass: 'text-primary hover:underline'
    },
    formatter(payload) {
      return {
        title: payload.title
      }
    }
  },
  github: {
    scale: 1,
    classNames: {
      linkClass: 'text-blue-500 font-semibold',
      iconClass: 'mr-1 text-gray-500'
    }
  }
})
```

You can also switch to pure `<a>` output (no icon wrapper/style):

```ts
md.use(MarkdownItExtraLink, {
  renderMode: 'anchor'
})
```

## Breaking Change

Style extension is now unified under `classNames` and only accepts `string`.

Links now apply automatic contextual spacing in inline text:
- Add left margin only when there is left-side text
- Add right margin only when there is right-side text
- No side text means no margin on that side

## Built-in Types

### `post`

Input:

```md
{link:post:734}
{link:post:734,文章别名}
```

Output HTML:

```html
<a href="/post/734" class="markdown-extra-link markdown-extra-link-post">《WordPress 迁移至 Hexo》</a>
<a href="/post/734" class="markdown-extra-link markdown-extra-link-post">文章别名</a>
```

`post` options:

- `globs`: glob string or array for auto scan, default `posts/**/index.md`, set `false` to disable
- `scanMode`: post index scan timing, `lazy` (default) scans on first resolve, `eager` scans on initialization
- `path`: path template with `:key` placeholders, default `/post/:id`
- `formatter`: returns placeholder params object used by `path`
- `classNames.linkClass`: class string applied to the `<a>` element

### `github`

Input:

```md
{link:github:imba97/blog-vite}
{link:github:imba97/blog-vite,My Blog}
```

Output HTML:

```html
<span style="..."></span><a href="https://github.com/imba97/blog-vite" class="markdown-extra-link markdown-extra-link-github">imba97/blog-vite</a>
<span style="..."></span><a href="https://github.com/imba97/blog-vite" class="markdown-extra-link markdown-extra-link-github">My Blog</a>
```

`github` options:

- `scale`: icon scale, default `1`
- `icon`: UnoCSS class (`i-mdi-github`) or image/data url
- `classNames.linkClass`: class string applied to the `<a>` element
- `classNames.iconClass`: class string applied to icon `<span>` wrapper

## Custom Types

Create custom types by implementing `AbstractLink`:

```ts
import { AbstractLink } from 'markdown-it-extra-link/abstract'

class BilibiliLinkType extends AbstractLink {
  readonly type = 'bili'

  protected handle(bvid = '') {
    bvid = bvid.trim()
    if (!bvid)
      return null
    return {
      href: `https://www.bilibili.com/video/${bvid}`,
      text: `Bilibili ${bvid}`
    }
  }
}
```

Then register:

```ts
md.use(MarkdownItExtraLink, {
  customTypes: [
    new BilibiliLinkType()
  ]
})
```

## RSS Entry

Use `markdown-it-extra-link/rss` for RSS-friendly output. It always renders pure `<a>` and requires `baseUrl` to make post links absolute:

```ts
import MarkdownIt from 'markdown-it'
import MarkdownItExtraLinkRss from 'markdown-it-extra-link/rss'

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true
})

md.use(MarkdownItExtraLinkRss, {
  baseUrl: 'https://example.com',
  post: {
    globs: 'posts/**/index.md'
  }
})
```
