import type { Person } from '@/types'
import { NODE_COLORS } from '@/lib/colors'
import { useGraphStore } from '@/store/graphStore'

interface Props {
  person: Person
  x: number
  y: number
}

const SOCIAL_LINKS = [
  { key: 'linkedin', icon: '🔗', label: 'LinkedIn' },
  { key: 'twitter',  icon: '𝕏',  label: 'Twitter'  },
  { key: 'github',   icon: '⌥',  label: 'GitHub'   },
  { key: 'email',    icon: '✉',  label: 'Email'    },
  { key: 'website',  icon: '🌐', label: 'Website'  },
] as const

export function HoverCard({ person, x, y }: Props) {
  const colors = NODE_COLORS[person.category]
  const connectionCount = useGraphStore((s) =>
    s.edges.filter((e) => e.source === person.id || e.target === person.id).length
  )

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{ left: x + 16, top: y - 10 }}
    >
      <div className="card p-4 w-64 shadow-xl">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium shrink-0"
            style={{ background: colors.ring, color: colors.fill, border: `1px solid ${colors.dim}` }}
          >
            {person.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
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

        {/* Social links */}
        <div className="space-y-1.5 mb-3">
          {SOCIAL_LINKS.map(({ key, icon, label }) => {
            const value = person[key as keyof Person] as string | undefined
            if (!value) return null
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-text-muted text-xs w-4">{icon}</span>
                <span className="text-text-secondary text-xs truncate" title={value}>
                  {value}
                </span>
              </div>
            )
          })}
        </div>

        {/* Tags */}
        {person.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {person.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}

        {/* Notes */}
        {person.notes && (
          <p className="text-text-muted text-xs italic leading-relaxed border-t border-border-subtle pt-2">
            {person.notes}
          </p>
        )}
      </div>
    </div>
  )
}
