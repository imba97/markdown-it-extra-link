import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

export interface TempPostFixture {
  cleanup: () => void
  globs: string
  writePost: (postId?: string, postTitle?: string) => void
}

export function createTempPost(
  id: string,
  title: string,
  writeImmediately = true,
  tempPrefix = 'markdown-it-extra-link-'
): TempPostFixture {
  const root = mkdtempSync(path.join(tmpdir(), tempPrefix))
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

export function withTempPost(
  id: string,
  title: string,
  run: (temp: TempPostFixture) => void
) {
  const temp = createTempPost(id, title)
  try {
    run(temp)
  }
  finally {
    temp.cleanup()
  }
}
