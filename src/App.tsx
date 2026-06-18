import { useState, useCallback, useRef, useEffect } from 'react'
import { GraphCanvas } from '@/components/GraphCanvas'
import { BlobLayer } from '@/components/BlobLayer'
import { HoverCard } from '@/components/HoverCard'
import { PersonModal } from '@/components/PersonModal'
import { Toolbar } from '@/components/Toolbar'
import { GroupPanel } from '@/components/GroupPanel'
import { ChatSidebar } from '@/components/ChatSidebar'
import { useGraphStore } from '@/store/graphStore'
import { useGroupStore } from '@/store/groupStore'
import { useChatStore } from '@/store/chatStore'
import type { Person } from '@/types'

export default function App() {
  const [hovered, setHovered] = useState<{ person: Person; x: number; y: number } | null>(null)
  const [modal, setModal] = useState<{ open: boolean; person?: Person }>({ open: false })
  const [groupPanelOpen, setGroupPanelOpen] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 })
  const containerRef = useRef<HTMLDivElement>(null)

  const { people, scale, offsetX, offsetY, linkSourceId, setLinkSource } = useGraphStore()
  const { visibleGroups } = useGroupStore()
  const { sidebarOpen, setSidebarOpen } = useChatStore()

  useEffect(() => {
    const obs = new ResizeObserver(([entry]) => {
      setCanvasSize({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  const handleHoverChange = useCallback((person: Person | null, x: number, y: number) => {
    setHovered(person ? { person, x, y } : null)
  }, [])

  const handleNodeClick = useCallback((person: Person) => {
    setModal({ open: true, person })
  }, [])

  const closeModal = useCallback(() => setModal({ open: false }), [])
  const linkSource = linkSourceId ? people.find((p) => p.id === linkSourceId) : null

  const hintRight = [
    sidebarOpen ? '20rem' : null,
    groupPanelOpen ? '18rem' : null,
  ].filter(Boolean).join(' + ')
  const hintRightStyle = hintRight ? `calc(${hintRight} + 12px)` : '12px'

  return (
    <div className="flex w-full h-full overflow-hidden bg-bg-primary">
      <div ref={containerRef} className="relative flex-1 min-w-0 h-full overflow-hidden">

        <BlobLayer
          people={people}
          groups={visibleGroups()}
          scale={scale}
          offsetX={offsetX}
          offsetY={offsetY}
          width={canvasSize.w}
          height={canvasSize.h}
        />

        <GraphCanvas
          onNodeClick={handleNodeClick}
          onHoverChange={handleHoverChange}
        />

        <Toolbar
          onAdd={() => setModal({ open: true })}
          onToggleGroups={() => setGroupPanelOpen(v => !v)}
          onToggleChats={() => setSidebarOpen(!sidebarOpen)}
          groupPanelOpen={groupPanelOpen}
          chatSidebarOpen={sidebarOpen}
        />

        {linkSource && (
          <div className="absolute top-14 left-3 z-10 flex items-center gap-2 card px-3 py-1.5 text-xs">
            <span className="text-accent-teal">
              Linking from {linkSource.name}
            </span>
            <span className="text-text-muted">shift+click another node</span>
            <button
              type="button"
              onClick={() => setLinkSource(null)}
              className="text-text-muted hover:text-text-primary ml-1"
            >
              Cancel
            </button>
          </div>
        )}

        {hovered && !modal.open && (
          <HoverCard
            person={hovered.person}
            x={hovered.x}
            y={hovered.y}
          />
        )}

        {modal.open && (
          <PersonModal
            person={modal.person}
            onClose={closeModal}
          />
        )}

        {groupPanelOpen && (
          <GroupPanel onClose={() => setGroupPanelOpen(false)} />
        )}

        <div
          className="absolute bottom-3 text-text-muted text-xs pointer-events-none"
          style={{ right: hintRightStyle }}
        >
          shift+click to link · scroll to zoom · drag to pan · click to edit
        </div>
      </div>

      {sidebarOpen && (
        <ChatSidebar onClose={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
