import { useGraphStore } from '@/store/graphStore'
import { useGroupStore } from '@/store/groupStore'
import { NODE_COLORS } from '@/lib/colors'
import type { NodeCategory } from '@/types'

interface Props {
  onAdd: () => void
  onToggleGroups: () => void
  onToggleChats: () => void
  groupPanelOpen: boolean
  chatSidebarOpen: boolean
}

const CATEGORIES: { key: NodeCategory; label: string }[] = [
  { key: 'mentor',    label: 'Mentor'    },
  { key: 'teammate',  label: 'Teammate'  },
  { key: 'employer',  label: 'Employer'  },
  { key: 'hackathon', label: 'Hackathon' },
]

export function Toolbar({ onAdd, onToggleGroups, onToggleChats, groupPanelOpen, chatSidebarOpen }: Props) {
  const { searchQuery, setSearch, people } = useGraphStore()
  const { groups, visibleGroups } = useGroupStore()
  const visibleCount = visibleGroups().length

  return (
    <div className="absolute top-3 left-3 right-3 z-10 flex items-center gap-2">
      <input
        className="input flex-1 max-w-xs h-9"
        placeholder="Search contacts…"
        value={searchQuery}
        onChange={e => setSearch(e.target.value)}
      />

      <button onClick={onAdd} className="btn-primary h-9 px-4">
        + Add
      </button>

      <button
        onClick={onToggleGroups}
        className={`btn h-9 px-3 ${groupPanelOpen ? 'border-accent-teal text-accent-teal' : ''}`}
      >
        ⬡ Groups
        {visibleCount < groups.length && (
          <span className="text-xs text-text-muted ml-1">
            {visibleCount}/{groups.length}
          </span>
        )}
      </button>

      <button
        onClick={onToggleChats}
        className={`btn h-9 px-3 ${chatSidebarOpen ? 'border-accent-teal text-accent-teal' : ''}`}
      >
        Chats
      </button>

      <div className="ml-auto hidden lg:flex items-center gap-3">
        {CATEGORIES.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full"
                 style={{ background: NODE_COLORS[key].fill }} />
            <span className="text-text-muted text-xs">{label}</span>
          </div>
        ))}
        <span className="text-text-muted text-xs ml-2 border-l border-border-subtle pl-2">
          {people.length} contacts
        </span>
      </div>
    </div>
  )
}
