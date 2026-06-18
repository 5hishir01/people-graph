// Convex hull (Graham scan) → smooth closed blob via cubic bezier

export interface Point { x: number; y: number }

function cross(O: Point, A: Point, B: Point) {
  return (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x)
}

export function convexHull(points: Point[]): Point[] {
  const n = points.length
  if (n < 2) return points
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
  const lower: Point[] = []
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
      lower.pop()
    lower.push(p)
  }
  const upper: Point[] = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
      upper.pop()
    upper.push(p)
  }
  upper.pop(); lower.pop()
  return lower.concat(upper)
}

// Expand hull outward by `padding` pixels from centroid
export function expandHull(hull: Point[], padding: number): Point[] {
  if (hull.length === 0) return []
  const cx = hull.reduce((s, p) => s + p.x, 0) / hull.length
  const cy = hull.reduce((s, p) => s + p.y, 0) / hull.length
  return hull.map(p => {
    const dx = p.x - cx, dy = p.y - cy
    const len = Math.hypot(dx, dy) || 1
    return { x: p.x + (dx / len) * padding, y: p.y + (dy / len) * padding }
  })
}

// Smooth closed path through hull points using catmull-rom → cubic bezier
export function smoothHullPath(pts: Point[]): string {
  if (pts.length < 2) return ''
  if (pts.length === 2) {
    // Draw a pill
    const [a, b] = pts
    const r = 18
    return `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2 - r} ${(a.y + b.y) / 2} ${b.x} ${b.y} Q ${(a.x + b.x) / 2 + r} ${(a.y + b.y) / 2} ${a.x} ${a.y} Z`
  }

  const n = pts.length
  const tension = 0.4
  let d = ''

  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]

    const cp1x = p1.x + (p2.x - p0.x) * tension / 2
    const cp1y = p1.y + (p2.y - p0.y) * tension / 2
    const cp2x = p2.x - (p3.x - p1.x) * tension / 2
    const cp2y = p2.y - (p3.y - p1.y) * tension / 2

    if (i === 0) d += `M ${p1.x} ${p1.y} `
    d += `C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y} `
  }
  return d + 'Z'
}

// Given person positions + radii, produce node boundary points for hull input
export function nodeRimPoints(cx: number, cy: number, r: number, count = 8): Point[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r }
  })
}
