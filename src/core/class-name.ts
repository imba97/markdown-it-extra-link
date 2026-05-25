export function normalizeClassName(value?: string): string[] {
  if (!value)
    return []
  return value
    .split(/\s+/)
    .map(item => item.trim())
    .filter(Boolean)
}

export function mergeClassName(...values: Array<string | undefined>): string {
  const merged = new Set<string>()
  for (const value of values) {
    for (const item of normalizeClassName(value))
      merged.add(item)
  }
  return Array.from(merged).join(' ')
}

export function mergeClassNameRecords(
  base?: Record<string, unknown>,
  extra?: Record<string, unknown>
): Record<string, string> | undefined {
  const baseRecord = base || {}
  const extraRecord = extra || {}
  const slots = new Set<string>([
    ...Object.keys(baseRecord),
    ...Object.keys(extraRecord)
  ])

  if (!slots.size)
    return undefined

  const merged: Record<string, string> = {}
  for (const slot of slots) {
    const className = mergeClassName(
      typeof baseRecord[slot] === 'string' ? baseRecord[slot] : undefined,
      typeof extraRecord[slot] === 'string' ? extraRecord[slot] : undefined
    )
    if (className)
      merged[slot] = className
  }

  return Object.keys(merged).length ? merged : undefined
}
