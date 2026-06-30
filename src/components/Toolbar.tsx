import { useRef } from 'react'
import { useGraphStore } from '@/store/graphStore'
import { useGroupStore } from '@/store/groupStore'
import { NODE_COLORS } from '@/lib/colors'
import type { NodeCategory } from '@/types'
import { computeGroupLayout, computeFitViewport } from '@/lib/layout'
import { downloadExport, parseImportJson, applyImport } from '@/lib/exportData'

interface Props {
  onAdd: () => void
  onToggleGroups: () => void
  onToggleChats: () => void
  groupPanelOpen: boolean
  chatSidebarOpen: boolean
  canvasSize: { w: number; h: number }
}

const CATEGORIES: { key: NodeCategory; label: string }[] = [
  { key: 'mentor', label: 'Mentor' },
  { key: 'teammate', label: 'Teammate' },
  { key: 'employer', label: 'Employer' },
  { key: 'hackathon', label: 'Hackathon' },
]

export function Toolbar({
  onAdd,
  onToggleGroups,
  onToggleChats,
  groupPanelOpen,
  chatSidebarOpen,
  canvasSize,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const {
    searchQuery, setSearch, people,
    categoryFilter, setCategoryFilter,
    setPositions, setViewport,
  } = useGraphStore()
  const { groups, visibleGroups } = useGroupStore()
  const visibleCount = visibleGroups().length

  const handleFit = () => {
    const { people } = useGraphStore.getState()
    const vp = computeFitViewport(people, canvasSize.w, canvasSize.h)
    setViewport(vp.scale, vp.offsetX, vp.offsetY)
  }

  const handleLayout = () => {
    const { people } = useGraphStore.getState()
    const { groups } = useGroupStore.getState()
    const positions = computeGroupLayout(people, groups)
    setPositions(positions)
    requestAnimationFrame(handleFit)
  }

  const handleImport = async (file: File) => {
    try {
      const text = await file.text()
      const data = parseImportJson(text)
      if (!confirm(`Import ${data.people.length} contacts, ${data.groups.length} groups? This replaces current data.`)) {
        return
      }
      applyImport(data)
      requestAnimationFrame(handleFit)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Import failed')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="absolute top-3 left-3 right-3 z-10 flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <input
          className="input flex-1 min-w-[140px] max-w-xs h-9"
          placeholder="Search contacts…"
          value={searchQuery}
          onChange={(e) => setSearch(e.target.value)}
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

        <div className="flex items-center gap-1">
          <button onClick={handleFit} className="btn h-9 px-3 text-xs" title="Fit graph to view">
            Fit
          </button>
          <button onClick={handleLayout} className="btn h-9 px-3 text-xs" title="Arrange by groups">
            Layout
          </button>
          <button onClick={downloadExport} className="btn h-9 px-3 text-xs" title="Export JSON backup">
            Export
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="btn h-9 px-3 text-xs"
            title="Import JSON backup"
          >
            Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleImport(f)
            }}
          />
        </div>

        <span className="text-text-muted text-xs ml-auto hidden sm:inline">
          {people.length} contacts
        </span>
      </div>

      <div className="hidden md:flex items-center gap-2 flex-wrap">
        {CATEGORIES.map(({ key, label }) => {
          const active = categoryFilter === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setCategoryFilter(active ? null : key)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors border ${
                active
                  ? 'border-accent-teal text-accent-teal bg-accent-teal/10'
                  : 'border-transparent text-text-muted hover:text-text-secondary hover:bg-white/5'
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: NODE_COLORS[key].fill }}
              />
              {label}
            </button>
          )
        })}
        {categoryFilter && (
          <button
            type="button"
            onClick={() => setCategoryFilter(null)}
            className="text-xs text-text-muted hover:text-text-primary"
          >
            Clear filter
          </button>
        )}
      </div>
    </div>
  )
}
