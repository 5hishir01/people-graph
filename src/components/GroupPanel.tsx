import { useState } from 'react'
import { useGroupStore } from '@/store/groupStore'
import { useGraphStore } from '@/store/graphStore'
import type { Group, RelationshipStrength } from '@/types/groups'
import { GROUP_PALETTE, STRENGTH_ORDER } from '@/types/groups'
import { FilterBar } from './FilterBar'

const STRENGTH_LABELS: Record<RelationshipStrength, string> = {
  close: 'Close', active: 'Active', dormant: 'Dormant',
}

const EMPTY_FORM = {
  name: '', location: '', connectedAt: '', strength: '' as RelationshipStrength | '',
  notes: '', color: GROUP_PALETTE[0], memberIds: [] as string[],
}

export function GroupPanel({ onClose }: { onClose: () => void }) {
  const { groups, addGroup, updateGroup, deleteGroup, toggleGroupVisibility, hiddenGroupIds, visibleGroups } = useGroupStore()
  const { people } = useGraphStore()
  const [editing, setEditing] = useState<Group | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const visible = visibleGroups()
  const visibleIds = new Set(visible.map(g => g.id))

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setAdding(true)
    setEditing(null)
  }

  const openEdit = (g: Group) => {
    setForm({
      name: g.name, location: g.location ?? '', connectedAt: g.connectedAt?.slice(0,7) ?? '',
      strength: g.strength ?? '', notes: g.notes ?? '', color: g.color,
      memberIds: [...g.memberIds],
    })
    setEditing(g)
    setAdding(false)
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    const data = {
      name: form.name.trim(),
      color: form.color,
      memberIds: form.memberIds,
      location: form.location || undefined,
      connectedAt: form.connectedAt ? form.connectedAt + '-01' : undefined,
      strength: (form.strength as RelationshipStrength) || undefined,
      notes: form.notes || undefined,
    }
    if (editing) { updateGroup(editing.id, data) }
    else          { addGroup(data) }
    setAdding(false); setEditing(null)
  }

  const toggleMember = (pid: string) => {
    setForm(f => ({
      ...f,
      memberIds: f.memberIds.includes(pid)
        ? f.memberIds.filter(id => id !== pid)
        : [...f.memberIds, pid],
    }))
  }

  const isFormOpen = adding || !!editing

  return (
    <div className="absolute right-0 top-0 bottom-0 z-20 w-72 card border-l border-border-subtle rounded-none flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
        <span className="text-text-primary text-sm font-medium">Groups</span>
        <div className="flex gap-2">
          <button onClick={openAdd} className="btn h-7 text-xs px-2">+ New</button>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-lg leading-none">×</button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-3 py-2 border-b border-border-subtle shrink-0">
        <FilterBar />
      </div>

      {/* Form */}
      {isFormOpen && (
        <div className="px-4 py-3 border-b border-border-subtle bg-bg-secondary shrink-0 space-y-2">
          <p className="text-text-secondary text-xs font-medium mb-2">
            {editing ? `Edit: ${editing.name}` : 'New group'}
          </p>

          <input className="input text-xs h-7" placeholder="Group name" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />

          <div className="flex gap-2">
            <input className="input text-xs h-7 flex-1" placeholder="Location" value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            <select className="input text-xs h-7 flex-1" value={form.strength}
              onChange={e => setForm(f => ({ ...f, strength: e.target.value as RelationshipStrength }))}>
              <option value="">Strength</option>
              {STRENGTH_ORDER.map(s => <option key={s} value={s}>{STRENGTH_LABELS[s]}</option>)}
            </select>
          </div>

          <input type="month" className="input text-xs h-7 w-full" value={form.connectedAt}
            onChange={e => setForm(f => ({ ...f, connectedAt: e.target.value }))}
            title="When did you connect with this group?" />

          {/* Color picker */}
          <div className="flex gap-1.5 flex-wrap">
            {GROUP_PALETTE.map(c => (
              <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                className="w-5 h-5 rounded-full border-2 transition-all"
                style={{ background: c, borderColor: form.color === c ? '#fff' : 'transparent' }} />
            ))}
          </div>

          {/* Members */}
          <div className="max-h-28 overflow-y-auto space-y-1">
            {people.map(p => (
              <label key={p.id} className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={form.memberIds.includes(p.id)}
                  onChange={() => toggleMember(p.id)}
                  className="accent-accent-teal" />
                <span className="text-text-secondary text-xs group-hover:text-text-primary">{p.name}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={() => { setAdding(false); setEditing(null) }} className="btn text-xs h-7 flex-1">Cancel</button>
            <button onClick={handleSave} className="btn-primary text-xs h-7 flex-1">Save</button>
          </div>
        </div>
      )}

      {/* Group list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {groups.length === 0 && (
          <p className="text-text-muted text-xs text-center mt-8">No groups yet. Create one to start clustering.</p>
        )}
        {groups.map(g => {
          const isHidden  = hiddenGroupIds.has(g.id)
          const isFiltered = !visibleIds.has(g.id) && !isHidden
          return (
            <div key={g.id}
              className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer group"
              style={{ opacity: isHidden || isFiltered ? 0.4 : 1 }}
            >
              {/* Color dot + visibility toggle */}
              <button onClick={() => toggleGroupVisibility(g.id)} title="Toggle visibility"
                className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                style={{ background: isHidden ? 'transparent' : g.color }} />

              <div className="flex-1 min-w-0" onClick={() => openEdit(g)}>
                <p className="text-text-primary text-xs font-medium truncate">{g.name}</p>
                <p className="text-text-muted text-xs">
                  {g.memberIds.length} member{g.memberIds.length !== 1 ? 's' : ''}
                  {g.location && ` · ${g.location}`}
                  {g.strength && ` · ${STRENGTH_LABELS[g.strength]}`}
                </p>
              </div>

              <button onClick={() => { if (confirm(`Delete group "${g.name}"?`)) deleteGroup(g.id) }}
                className="text-text-muted hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                ×
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
