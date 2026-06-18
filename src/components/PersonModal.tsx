import { useState, useEffect, useMemo } from 'react'
import type { Person } from '@/types'
import { useGraphStore } from '@/store/graphStore'

interface Props {
  person?: Person | null
  onClose: () => void
}

const EMPTY = {
  name: '', role: '', linkedin: '', twitter: '',
  github: '', email: '', website: '', tags: '', notes: '',
}


export function PersonModal({ person, onClose }: Props) {
  const { people, edges, addPerson, updatePerson, deletePerson, addEdge, removeEdge } = useGraphStore()
  const [form, setForm] = useState(EMPTY)
  const isEdit = !!person

  const connections = useMemo(() => {
    if (!person) return [] as Person[]
    const linked = new Map<string, Person>()
    for (const e of edges) {
      if (e.source === person.id) {
        const other = people.find((p) => p.id === e.target)
        if (other) linked.set(other.id, other)
      } else if (e.target === person.id) {
        const other = people.find((p) => p.id === e.source)
        if (other) linked.set(other.id, other)
      }
    }
    return [...linked.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [person, edges, people])

  const connectable = useMemo(() => {
    if (!person) return [] as Person[]
    const linkedIds = new Set(connections.map((p) => p.id))
    return people
      .filter((p) => p.id !== person.id && !linkedIds.has(p.id))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [person, people, connections])

  useEffect(() => {
    if (person) {
      setForm({
        name: person.name,
        role: person.role,
        linkedin: person.linkedin ?? '',
        twitter: person.twitter ?? '',
        github: person.github ?? '',
        email: person.email ?? '',
        website: person.website ?? '',
        tags: person.tags.join(', '),
        notes: person.notes ?? '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [person])

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSave = () => {
    if (!form.name.trim()) return
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    const data = {
      name: form.name.trim(),
      role: form.role.trim(),
      linkedin: form.linkedin.trim(),
      twitter: form.twitter.trim(),
      github: form.github.trim(),
      email: form.email.trim(),
      website: form.website.trim(),
      tags,
      notes: form.notes.trim(),
    }
    if (isEdit && person) {
      updatePerson(person.id, data)
    } else {
      addPerson(data)
    }
    onClose()
  }

  const handleDelete = () => {
    if (person && confirm(`Remove ${person.name} from your graph?`)) {
      deletePerson(person.id)
      onClose()
    }
  }

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card w-80 p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-primary text-sm font-medium">
            {isEdit ? 'Edit contact' : 'Add contact'}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-lg leading-none">×</button>
        </div>

        <div className="space-y-3">
          {[
            { key: 'name',     label: 'Name',             placeholder: 'Jane Smith'             },
            { key: 'role',     label: 'Role / company',   placeholder: 'VC Partner @ Sequoia'   },
            { key: 'linkedin', label: 'LinkedIn',         placeholder: 'linkedin.com/in/…'      },
            { key: 'twitter',  label: 'Twitter / X',      placeholder: '@handle'                },
            { key: 'github',   label: 'GitHub',           placeholder: '@handle'                },
            { key: 'email',    label: 'Email',            placeholder: 'jane@…'                 },
            { key: 'website',  label: 'Website',          placeholder: 'https://…'              },
            { key: 'tags',     label: 'Tags',             placeholder: 'mentor, H1B, Boston'    },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-text-muted text-xs mb-1">{label}</label>
              <input
                className="input"
                placeholder={placeholder}
                value={form[key as keyof typeof form]}
                onChange={f(key)}
              />
            </div>
          ))}
          <div>
            <label className="block text-text-muted text-xs mb-1">Notes</label>
            <textarea
              className="input resize-none h-20"
              placeholder="Any context about this person…"
              value={form.notes}
              onChange={f('notes')}
            />
          </div>

          {isEdit && person && (
            <div>
              <label className="block text-text-muted text-xs mb-1">
                Connections ({connections.length})
              </label>
              {connections.length > 0 && (
                <div className="space-y-1 mb-2">
                  {connections.map((c) => (
                    <div key={c.id} className="flex items-center gap-2">
                      <span className="text-text-secondary text-xs flex-1 truncate">{c.name}</span>
                      <button
                        type="button"
                        onClick={() => removeEdge(person.id, c.id)}
                        className="text-text-muted hover:text-red-400 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {connectable.length > 0 ? (
                <select
                  className="input text-xs"
                  defaultValue=""
                  onChange={(e) => {
                    const targetId = e.target.value
                    if (targetId) addEdge(person.id, targetId)
                    e.target.value = ''
                  }}
                >
                  <option value="" disabled>Add connection…</option>
                  {connectable.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-text-muted text-xs">No other contacts to link.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          {isEdit && (
            <button onClick={handleDelete} className="btn text-red-400 hover:text-red-300 hover:border-red-400">
              Delete
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="btn">Cancel</button>
          <button onClick={handleSave} className="btn-primary">
            {isEdit ? 'Save' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}
