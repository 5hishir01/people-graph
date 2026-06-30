import { useLayoutEffect, useRef, useState } from 'react'
import type { Person } from '@/types'
import { NODE_COLORS } from '@/lib/colors'
import { useGraphStore } from '@/store/graphStore'
import { socialHref } from '@/lib/socialLinks'

interface Props {
  person: Person
  x: number
  y: number
  bounds: { w: number; h: number }
}

const SOCIAL_LINKS = [
  { key: 'linkedin', icon: '🔗', label: 'LinkedIn' },
  { key: 'twitter', icon: '𝕏', label: 'Twitter' },
  { key: 'github', icon: '⌥', label: 'GitHub' },
  { key: 'email', icon: '✉', label: 'Email' },
  { key: 'website', icon: '🌐', label: 'Website' },
] as const

const CARD_W = 256
const CARD_H_EST = 220

export function HoverCard({ person, x, y, bounds }: Props) {
  const colors = NODE_COLORS[person.category]
  const connectionCount = useGraphStore((s) =>
    s.edges.filter((e) => e.source === person.id || e.target === person.id).length
  )
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: x + 16, top: y - 10 })

  useLayoutEffect(() => {
    const el = ref.current
    const h = el?.offsetHeight ?? CARD_H_EST
    const w = el?.offsetWidth ?? CARD_W
    const pad = 12

    let left = x + 16
    let top = y - 10

    if (left + w + pad > bounds.w) left = x - w - 16
    if (left < pad) left = pad
    if (top + h + pad > bounds.h) top = bounds.h - h - pad
    if (top < pad) top = pad

    setPos({ left, top })
  }, [x, y, bounds.w, bounds.h, person.id])

  return (
    <div
      ref={ref}
      className="absolute z-50"
      style={{ left: pos.left, top: pos.top }}
    >
      <div className="card p-4 w-64 shadow-xl pointer-events-auto">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium shrink-0"
            style={{ background: colors.ring, color: colors.fill, border: `1px solid ${colors.dim}` }}
          >
            {person.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
          </div>
          <div className="min-w-0">
            <p className="text-text-primary text-sm font-medium leading-tight truncate">
              {person.name}
            </p>
            <p className="text-text-secondary text-xs leading-tight mt-0.5 line-clamp-2">
              {person.role}
            </p>
            {connectionCount > 0 && (
              <p className="text-text-muted text-xs mt-0.5">
                {connectionCount} connection{connectionCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1.5 mb-3">
          {SOCIAL_LINKS.map(({ key, icon, label }) => {
            const value = person[key as keyof Person] as string | undefined
            if (!value) return null
            const href = socialHref(key, value)
            return (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-accent-teal transition-colors group"
                title={label}
              >
                <span className="text-text-muted text-xs w-4">{icon}</span>
                <span className="text-text-secondary text-xs truncate group-hover:text-accent-teal">
                  {value}
                </span>
              </a>
            )
          })}
        </div>

        {person.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {person.tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}

        {person.notes && (
          <p className="text-text-muted text-xs italic leading-relaxed border-t border-border-subtle pt-2">
            {person.notes}
          </p>
        )}
      </div>
    </div>
  )
}
