export function socialHref(key: string, value: string): string {
  const v = value.trim()
  if (!v) return '#'

  if (key === 'email') {
    return v.startsWith('mailto:') ? v : `mailto:${v}`
  }
  if (key === 'website') {
    return v.startsWith('http') ? v : `https://${v}`
  }
  if (key === 'linkedin') {
    if (v.startsWith('http')) return v
    return `https://${v.replace(/^\/\//, '')}`
  }
  if (key === 'github') {
    if (v.startsWith('http')) return v
    const handle = v.replace(/^@/, '')
    return `https://github.com/${handle}`
  }
  if (key === 'twitter') {
    if (v.startsWith('http')) return v
    const handle = v.replace(/^@/, '')
    return `https://twitter.com/${handle}`
  }
  return v.startsWith('http') ? v : `https://${v}`
}
