import { useMemo, useRef, useEffect, useState } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useGroupStore } from '@/store/groupStore'
import { useGraphStore } from '@/store/graphStore'
import { NODE_COLORS } from '@/lib/colors'
import type { Group } from '@/types/groups'
import type { Person } from '@/types'

const UNGROUPED_ID = '__ungrouped__'

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function PersonRow({
  person,
  active,
  indent,
  onSelect,
}: {
  person: Person
  active: boolean
  indent?: boolean
  onSelect: () => void
}) {
  const colors = NODE_COLORS[person.category]
  const preview = useChatStore((s) => {
    const msgs = s.messages.filter((m) => m.personId === person.id)
    return msgs.length > 0 ? msgs[msgs.length - 1].content : null
  })

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-start gap-2 py-1.5 pr-2 rounded-md text-left transition-colors ${
        indent ? 'pl-7' : 'pl-2'
      } ${active ? 'bg-white/8' : 'hover:bg-white/5'}`}
    >
      <span
        className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-medium shrink-0 mt-0.5"
        style={{ background: colors.ring, color: colors.fill }}
      >
        {person.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-xs truncate ${active ? 'text-text-primary' : 'text-text-secondary'}`}>
          {person.name}
        </span>
        {preview && (
          <span className="block text-text-muted text-[10px] truncate mt-0.5">{preview}</span>
        )}
      </span>
    </button>
  )
}

function GroupFolder({
  group,
  members,
  expanded,
  activePersonId,
  onToggle,
  onSelectPerson,
}: {
  group: Group
  members: Person[]
  expanded: boolean
  activePersonId: string | null
  onToggle: () => void
  onSelectPerson: (id: string) => void
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-1.5 py-1.5 px-2 rounded-md hover:bg-white/5 text-left"
      >
        <span className="text-text-muted text-[10px] w-3 shrink-0">{expanded ? '▾' : '▸'}</span>
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: group.color }}
        />
        <span className="text-text-primary text-xs font-medium truncate flex-1">
          {group.name}
        </span>
        <span className="text-text-muted text-[10px] shrink-0">{members.length}</span>
      </button>
      {expanded && (
        <div className="pb-1">
          {members.length === 0 ? (
            <p className="text-text-muted text-[10px] pl-7 py-1">No members</p>
          ) : (
            members.map((p) => (
              <PersonRow
                key={`${group.id}-${p.id}`}
                person={p}
                active={activePersonId === p.id}
                indent
                onSelect={() => onSelectPerson(p.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function ChatThread({ person }: { person: Person }) {
  const { messagesFor, addMessage, deleteMessage } = useChatStore()
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const messages = messagesFor(person.id)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages.length, person.id])

  const handleSend = () => {
    if (!draft.trim()) return
    addMessage(person.id, draft)
    setDraft('')
  }

  return (
    <>
      <div className="px-3 py-2 border-b border-border-subtle shrink-0">
        <p className="text-text-primary text-sm font-medium truncate">{person.name}</p>
        <p className="text-text-muted text-xs truncate">{person.role}</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {messages.length === 0 ? (
          <p className="text-text-muted text-xs text-center mt-6 px-2 leading-relaxed">
            Log notes, follow-ups, or conversation snippets with {person.name.split(' ')[0]}.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="group relative">
              <p className="text-text-primary text-xs leading-relaxed whitespace-pre-wrap break-words">
                {m.content}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-text-muted text-[10px]">{formatTime(m.createdAt)}</span>
                <button
                  type="button"
                  onClick={() => deleteMessage(m.id)}
                  className="text-text-muted hover:text-red-400 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-2 border-t border-border-subtle shrink-0">
        <div className="flex gap-2">
          <textarea
            className="input resize-none h-16 text-xs flex-1"
            placeholder={`Note about ${person.name.split(' ')[0]}…`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <button type="button" onClick={handleSend} className="btn-primary h-16 px-3 text-xs self-end">
            Send
          </button>
        </div>
      </div>
    </>
  )
}

export function ChatSidebar({ onClose }: { onClose: () => void }) {
  const { people } = useGraphStore()
  const { groups } = useGroupStore()
  const {
    activePersonId,
    expandedGroupIds,
    setActivePerson,
    toggleGroupExpanded,
  } = useChatStore()

  const activePerson = activePersonId
    ? people.find((p) => p.id === activePersonId) ?? null
    : null

  const ungrouped = useMemo(() => {
    const inGroup = new Set(groups.flatMap((g) => g.memberIds))
    return people
      .filter((p) => !inGroup.has(p.id))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [groups, people])

  const groupMembers = useMemo(() => {
    const map = new Map<string, Person[]>()
    for (const g of groups) {
      const members = g.memberIds
        .map((id) => people.find((p) => p.id === id))
        .filter((p): p is Person => !!p)
        .sort((a, b) => a.name.localeCompare(b.name))
      map.set(g.id, members)
    }
    return map
  }, [groups, people])

  const ungroupedExpanded = expandedGroupIds.includes(UNGROUPED_ID)

  return (
    <div className="w-80 shrink-0 h-full card border-l border-border-subtle rounded-none flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-subtle shrink-0">
        <span className="text-text-primary text-sm font-medium">Chats</span>
        <button
          type="button"
          onClick={onClose}
          className="text-text-muted hover:text-text-primary text-lg leading-none"
          title="Hide sidebar"
        >
          ×
        </button>
      </div>

      <div
        className={`overflow-y-auto shrink-0 border-b border-border-subtle ${
          activePerson ? 'max-h-[42%]' : 'flex-1 min-h-0'
        }`}
      >
        <div className="py-1">
          {groups.map((g) => (
            <GroupFolder
              key={g.id}
              group={g}
              members={groupMembers.get(g.id) ?? []}
              expanded={expandedGroupIds.includes(g.id)}
              activePersonId={activePersonId}
              onToggle={() => toggleGroupExpanded(g.id)}
              onSelectPerson={setActivePerson}
            />
          ))}

          {ungrouped.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => toggleGroupExpanded(UNGROUPED_ID)}
                className="w-full flex items-center gap-1.5 py-1.5 px-2 rounded-md hover:bg-white/5 text-left"
              >
                <span className="text-text-muted text-[10px] w-3 shrink-0">
                  {ungroupedExpanded ? '▾' : '▸'}
                </span>
                <span className="w-2 h-2 rounded-full shrink-0 bg-text-muted" />
                <span className="text-text-secondary text-xs font-medium truncate flex-1">
                  Ungrouped
                </span>
                <span className="text-text-muted text-[10px] shrink-0">{ungrouped.length}</span>
              </button>
              {ungroupedExpanded && (
                <div className="pb-1">
                  {ungrouped.map((p) => (
                    <PersonRow
                      key={p.id}
                      person={p}
                      active={activePersonId === p.id}
                      indent
                      onSelect={() => setActivePerson(p.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {activePerson ? (
        <div className="flex-1 min-h-0 flex flex-col">
          <ChatThread person={activePerson} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-text-muted text-xs text-center leading-relaxed">
            Expand a group folder and pick a contact to open their chat log.
          </p>
        </div>
      )}
    </div>
  )
}
