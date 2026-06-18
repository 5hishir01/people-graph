export type NodeCategory = 'mentor' | 'employer' | 'hackathon' | 'teammate' | 'default'

export interface Person {
  id: string
  name: string
  role: string
  category: NodeCategory
  linkedin?: string
  twitter?: string
  github?: string
  email?: string
  website?: string
  x: number
  y: number
  r: number
  tags: string[]
  notes?: string
  created_at?: string
}

export interface Edge {
  source: string
  target: string
  label?: string
}

export interface GraphState {
  people: Person[]
  edges: Edge[]
  scale: number
  offsetX: number
  offsetY: number
  hoveredId: string | null
  selectedId: string | null
  searchQuery: string
}
