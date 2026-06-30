import type { Person } from '@/types'
import type { Group } from '@/types/groups'

const CELL_W = 280
const CELL_H = 220
const ORIGIN_X = 160
const ORIGIN_Y = 120

/** Place each group's members in a tight cluster on a grid. */
export function computeGroupLayout(
  people: Person[],
  groups: Group[]
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}
  const assigned = new Set<string>()

  const cols = Math.max(1, Math.ceil(Math.sqrt(groups.length + 1)))

  groups.forEach((group, gi) => {
    const col = gi % cols
    const row = Math.floor(gi / cols)
    const cx = ORIGIN_X + col * CELL_W
    const cy = ORIGIN_Y + row * CELL_H

    const members = group.memberIds
      .map((id) => people.find((p) => p.id === id))
      .filter(Boolean) as Person[]

    if (members.length === 0) return

    const ringR = 28 + members.length * 6
    members.forEach((m, i) => {
      const angle = (i / members.length) * Math.PI * 2 - Math.PI / 2
      positions[m.id] = {
        x: cx + Math.cos(angle) * ringR,
        y: cy + Math.sin(angle) * ringR,
      }
      assigned.add(m.id)
    })
  })

  const ungrouped = people.filter((p) => !assigned.has(p.id))
  if (ungrouped.length > 0) {
    const row = Math.ceil((groups.length + 1) / cols)
    const cx = ORIGIN_X + ((groups.length) % cols) * CELL_W
    const cy = ORIGIN_Y + row * CELL_H
    const ringR = 40 + ungrouped.length * 8
    ungrouped.forEach((p, i) => {
      const angle = (i / ungrouped.length) * Math.PI * 2 - Math.PI / 2
      positions[p.id] = {
        x: cx + Math.cos(angle) * ringR,
        y: cy + Math.sin(angle) * ringR,
      }
    })
  }

  return positions
}

/** Fit all nodes into the visible canvas with padding. */
export function computeFitViewport(
  people: Person[],
  width: number,
  height: number,
  padding = 64
): { scale: number; offsetX: number; offsetY: number } {
  if (people.length === 0) {
    return { scale: 1, offsetX: 0, offsetY: 0 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const p of people) {
    minX = Math.min(minX, p.x - p.r - 20)
    minY = Math.min(minY, p.y - p.r - 20)
    maxX = Math.max(maxX, p.x + p.r + 20)
    maxY = Math.max(maxY, p.y + p.r + 28)
  }

  const worldW = Math.max(maxX - minX, 80)
  const worldH = Math.max(maxY - minY, 80)
  const scale = Math.min(
    (width - padding * 2) / worldW,
    (height - padding * 2) / worldH,
    4
  )
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2

  return {
    scale: Math.max(0.35, scale),
    offsetX: width / 2 - cx * scale,
    offsetY: height / 2 - cy * scale,
  }
}
