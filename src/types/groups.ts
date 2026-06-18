export type RelationshipStrength = 'close' | 'active' | 'dormant'

export interface Group {
  id: string
  name: string
  color: string          // hex — user picks or auto-assigned
  memberIds: string[]    // Person.id[]

  // filter metadata
  location?: string      // 'NEU' | 'MLH' | 'AI Skunkworks' | 'Online' | custom
  connectedAt?: string   // ISO date string — when you first connected with this group
  strength?: RelationshipStrength
  notes?: string
}

export type GroupFilter = {
  location?: string
  strengthMin?: RelationshipStrength
  after?: string         // ISO date
  before?: string        // ISO date
}

export const STRENGTH_ORDER: RelationshipStrength[] = ['close', 'active', 'dormant']

export const GROUP_PALETTE = [
  '#1D9E75', // teal
  '#7F77DD', // purple
  '#EF9F27', // amber
  '#378ADD', // blue
  '#D85A30', // coral
  '#D4537E', // pink
  '#639922', // green
  '#888780', // gray
]
