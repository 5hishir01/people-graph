import type { NodeCategory } from '@/types'

export const NODE_COLORS: Record<NodeCategory, { fill: string; dim: string; ring: string }> = {
  mentor:    { fill: '#1D9E75', dim: '#1D9E7566', ring: '#1D9E7522' },
  employer:  { fill: '#EF9F27', dim: '#EF9F2766', ring: '#EF9F2722' },
  hackathon: { fill: '#7F77DD', dim: '#7F77DD66', ring: '#7F77DD22' },
  teammate:  { fill: '#378ADD', dim: '#378ADD66', ring: '#378ADD22' },
  default:   { fill: '#888780', dim: '#88878066', ring: '#88878022' },
}

export function getNodeCategory(tags: string[]): NodeCategory {
  if (tags.includes('mentor'))                            return 'mentor'
  if (tags.includes('H1B') || tags.includes('employer')) return 'employer'
  if (tags.includes('hackathon'))                        return 'hackathon'
  if (tags.includes('teammate'))                         return 'teammate'
  return 'default'
}
