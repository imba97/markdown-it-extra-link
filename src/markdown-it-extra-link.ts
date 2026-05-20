import type MarkdownIt from 'markdown-it'
import type { ExtraLink, MarkdownItExtraLinkOptions } from './types'
import { GithubLink, PostLink } from './builtin'
import { createExtraLinkRule } from './core/parser'

export function createBuiltinTypes(options: MarkdownItExtraLinkOptions): ExtraLink[] {
  const types: ExtraLink[] = []
  if (options.post !== false)
    types.push(new PostLink(typeof options.post === 'object' ? options.post : {}))
  if (options.github !== false)
    types.push(new GithubLink(typeof options.github === 'object' ? options.github : {}))
  return types
}

export default function MarkdownItExtraLink(
  md: MarkdownIt,
  options: MarkdownItExtraLinkOptions = {}
) {
  const builtin = createBuiltinTypes(options)
  const custom = options.customTypes || []
  const allTypes = [...builtin]

  for (const type of custom) {
    const index = allTypes.findIndex(item => item.type === type.type)
    if (index >= 0)
      allTypes[index] = type
    else
      allTypes.push(type)
  }

  md.inline.ruler.before('text', 'extra-link', createExtraLinkRule(md, options, allTypes))
}
