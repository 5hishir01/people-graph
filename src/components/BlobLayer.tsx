import { useEffect, useRef } from 'react'
import type { Person } from '@/types'
import type { Group } from '@/types/groups'
import { convexHull, expandHull, smoothHullPath, nodeRimPoints } from '@/lib/hull'

interface Props {
  people: Person[]
  groups: Group[]
  scale: number
  offsetX: number
  offsetY: number
  width: number
  height: number
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function BlobLayer({ people, groups, scale, offsetX, offsetY, width, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width  = width  * dpr
    canvas.height = height * dpr
    canvas.style.width  = width  + 'px'
    canvas.style.height = height + 'px'

    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(dpr, dpr)

    const personMap = new Map(people.map(p => [p.id, p]))

    groups.forEach(group => {
      const members = group.memberIds.map(id => personMap.get(id)).filter(Boolean) as Person[]
      if (members.length === 0) return

      // Collect rim points of all member nodes in canvas space
      const allPoints = members.flatMap(p => {
        const cx = p.x * scale + offsetX
        const cy = p.y * scale + offsetY
        const r  = p.r * scale
        return nodeRimPoints(cx, cy, r, 12)
      })

      if (allPoints.length === 0) return

      const hull    = convexHull(allPoints)
      const padded  = expandHull(hull, 22 + 6 * scale)
      const pathStr = smoothHullPath(padded)

      if (!pathStr) return

      const path = new Path2D(pathStr)

      // Fill
      ctx.fillStyle = hexToRgba(group.color, 0.07)
      ctx.fill(path)

      // Stroke
      ctx.strokeStyle = hexToRgba(group.color, 0.30)
      ctx.lineWidth   = 1.2
      ctx.setLineDash([])
      ctx.stroke(path)

      // Group label — placed above the topmost point of the hull
      if (padded.length > 0) {
        const topPoint = padded.reduce((min, p) => p.y < min.y ? p : min, padded[0])
        const labelX = padded.reduce((s, p) => s + p.x, 0) / padded.length
        const labelY = topPoint.y - 8

        ctx.font = `500 11px Inter, sans-serif`
        ctx.fillStyle = hexToRgba(group.color, 0.85)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText(group.name.toUpperCase(), labelX, labelY)
      }
    })

    ctx.restore()
  }, [people, groups, scale, offsetX, offsetY, width, height])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width, height }}
    />
  )
}
