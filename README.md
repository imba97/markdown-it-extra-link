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
    formatter(payload) {
      return {
        title: payload.title
      }
    }
  },
  github: {
    scale: 1
  }
})
```

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
- `path`: path template with `:key` placeholders, default `/post/:id`
- `formatter`: returns placeholder params object used by `path`

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
