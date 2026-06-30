import { useRef, useEffect, useCallback, useMemo } from 'react'
import { useGraphStore } from '@/store/graphStore'
import { NODE_COLORS } from '@/lib/colors'
import type { Person } from '@/types'

interface Props {
  onNodeClick: (person: Person) => void
  onHoverChange: (person: Person | null, canvasX: number, canvasY: number) => void
}

export function GraphCanvas({ onNodeClick, onHoverChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const {
    people, edges, scale, offsetX, offsetY,
    hoveredId, linkSourceId, searchQuery, categoryFilter,
    setHovered, setViewport, updatePosition, setLinkSource, addEdge,
  } = useGraphStore()

  const dragRef = useRef<{ id: string; lx: number; ly: number } | null>(null)
  const panRef = useRef<{ lx: number; ly: number } | null>(null)
  const stateRef = useRef({ scale, offsetX, offsetY })

  useEffect(() => { stateRef.current = { scale, offsetX, offsetY } }, [scale, offsetX, offsetY])

  const neighborIds = useMemo(() => {
    if (!hoveredId) return new Set<string>()
    const ids = new Set<string>([hoveredId])
    for (const e of edges) {
      if (e.source === hoveredId) ids.add(e.target)
      if (e.target === hoveredId) ids.add(e.source)
    }
    return ids
  }, [hoveredId, edges])

  const matchesFilters = useCallback((p: Person) => {
    if (categoryFilter && p.category !== categoryFilter) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return p.name.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q))
  }, [searchQuery, categoryFilter])

  const nodeAlpha = useCallback((p: Person) => {
    const matches = matchesFilters(p)
    if (!matches) return 0.2
    if (hoveredId) {
      return neighborIds.has(p.id) ? 1 : 0.18
    }
    return 1
  }, [matchesFilters, hoveredId, neighborIds])

  const hitTest = useCallback((cx: number, cy: number): Person | null => {
    const { scale: s, offsetX: ox, offsetY: oy } = stateRef.current
    for (const p of [...people].reverse()) {
      const px = p.x * s + ox
      const py = p.y * s + oy
      const r = p.r * s + 6
      if ((cx - px) ** 2 + (cy - py) ** 2 < r * r) return p
    }
    return null
  }, [people])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const ctx = canvas.getContext('2d')!
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)
    ctx.save()
    ctx.scale(dpr, dpr)

    const { scale: s, offsetX: ox, offsetY: oy } = stateRef.current

    // Edges (behind nodes)
    edges.forEach(({ source, target }) => {
      const a = people.find((p) => p.id === source)
      const b = people.find((p) => p.id === target)
      if (!a || !b) return

      const ca = { x: a.x * s + ox, y: a.y * s + oy }
      const cb = { x: b.x * s + ox, y: b.y * s + oy }

      const edgeHighlighted =
        hoveredId &&
        (source === hoveredId || target === hoveredId)
      const edgeDimmed =
        hoveredId && !edgeHighlighted

      let alpha = 0.07
      if (edgeHighlighted) alpha = 0.45
      else if (edgeDimmed) alpha = 0.03
      else if (!matchesFilters(a) || !matchesFilters(b)) alpha = 0.03

      ctx.beginPath()
      ctx.moveTo(ca.x, ca.y)
      ctx.lineTo(cb.x, cb.y)
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`
      ctx.lineWidth = edgeHighlighted ? 1.4 : 0.8
      ctx.stroke()
    })

    // Nodes
    people.forEach((p) => {
      const alpha = nodeAlpha(p)
      const { x: cx, y: cy } = { x: p.x * s + ox, y: p.y * s + oy }
      const r = p.r * s
      const isHov = hoveredId === p.id
      const isLink = linkSourceId === p.id
      const colors = NODE_COLORS[p.category]

      ctx.save()
      ctx.globalAlpha = alpha

      if (isLink) {
        ctx.beginPath()
        ctx.arc(cx, cy, r + 8, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(29, 158, 117, 0.85)'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      if (isHov) {
        ctx.beginPath()
        ctx.arc(cx, cy, r + 5, 0, Math.PI * 2)
        ctx.fillStyle = colors.ring
        ctx.fill()
      }

      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = isHov ? colors.fill : colors.dim
      ctx.fill()

      const initials = p.name.split(' ').map((w) => w[0]).slice(0, 2).join('')
      ctx.fillStyle = 'rgba(255,255,255,0.92)'
      ctx.font = `${Math.max(9, 10 * s)}px Inter, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(initials, cx, cy)

      if (s > 0.6 && alpha > 0.5) {
        ctx.fillStyle = isHov ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)'
        ctx.font = `${Math.max(9, 9 * s)}px Inter, sans-serif`
        ctx.fillText(p.name.split(' ')[0], cx, cy + r + 10 * s)
      }

      ctx.restore()
    })

    ctx.restore()
  }, [people, edges, hoveredId, linkSourceId, searchQuery, categoryFilter, matchesFilters, nodeAlpha])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const obs = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      draw()
    })
    obs.observe(canvas)
    return () => obs.disconnect()
  }, [draw])

  useEffect(() => { draw() }, [draw])

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top

    if (dragRef.current) {
      const { id, lx, ly } = dragRef.current
      const { scale: s } = stateRef.current
      const p = people.find((p) => p.id === id)!
      updatePosition(id, p.x + (cx - lx) / s, p.y + (cy - ly) / s)
      dragRef.current = { id, lx: cx, ly: cy }
      return
    }
    if (panRef.current) {
      const { lx, ly } = panRef.current
      const { scale: s, offsetX: ox, offsetY: oy } = stateRef.current
      setViewport(s, ox + (cx - lx), oy + (cy - ly))
      panRef.current = { lx: cx, ly: cy }
      return
    }

    const hit = hitTest(cx, cy)
    setHovered(hit?.id ?? null)
    onHoverChange(hit, cx, cy)
    canvasRef.current!.style.cursor = hit ? 'pointer' : 'grab'
  }, [people, hitTest, setHovered, onHoverChange, updatePosition, setViewport])

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const hit = hitTest(cx, cy)
    if (e.shiftKey && hit) {
      if (!linkSourceId) setLinkSource(hit.id)
      else if (linkSourceId !== hit.id) addEdge(linkSourceId, hit.id)
      else setLinkSource(null)
      return
    }
    if (hit) {
      dragRef.current = { id: hit.id, lx: cx, ly: cy }
    } else {
      setLinkSource(null)
      panRef.current = { lx: cx, ly: cy }
      canvasRef.current!.style.cursor = 'grabbing'
    }
  }, [hitTest, linkSourceId, setLinkSource, addEdge])

  const onMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const wasDrag = dragRef.current
    const rect = canvasRef.current!.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    dragRef.current = null
    panRef.current = null
    canvasRef.current!.style.cursor = 'grab'
    if (wasDrag) {
      const dist = Math.hypot(cx - wasDrag.lx, cy - wasDrag.ly)
      if (dist < 4) onNodeClick(people.find((p) => p.id === wasDrag.id)!)
    }
  }, [people, onNodeClick])

  const onWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const rect = canvasRef.current!.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const { scale: s, offsetX: ox, offsetY: oy } = stateRef.current
    const delta = e.deltaY > 0 ? 0.92 : 1.08
    const ns = Math.max(0.25, Math.min(4, s * delta))
    const wx = (cx - ox) / s
    const wy = (cy - oy) / s
    setViewport(ns, cx - wx * ns, cy - wy * ns)
  }, [setViewport])

  const onMouseLeave = useCallback(() => {
    dragRef.current = null
    panRef.current = null
    setHovered(null)
    onHoverChange(null, 0, 0)
  }, [setHovered, onHoverChange])

  return (
    <canvas
      ref={canvasRef}
      className="graph-canvas"
      onMouseMove={onMouseMove}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onWheel={onWheel}
      onMouseLeave={onMouseLeave}
    />
  )
}
