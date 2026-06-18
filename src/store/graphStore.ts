import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Person, Edge } from '@/types'
import { SEED_PEOPLE, SEED_EDGES } from '@/lib/seed'
import { getNodeCategory } from '@/lib/colors'

interface GraphStore {
  people: Person[]
  edges: Edge[]
  scale: number
  offsetX: number
  offsetY: number
  hoveredId: string | null
  selectedId: string | null
  linkSourceId: string | null
  searchQuery: string

  // actions
  addPerson: (p: Omit<Person, 'id' | 'x' | 'y' | 'r' | 'category'>) => void
  updatePerson: (id: string, patch: Partial<Person>) => void
  deletePerson: (id: string) => void
  addEdge: (source: string, target: string) => void
  removeEdge: (a: string, b: string) => void
  setHovered: (id: string | null) => void
  setSelected: (id: string | null) => void
  setLinkSource: (id: string | null) => void
  setSearch: (q: string) => void
  setViewport: (scale: number, offsetX: number, offsetY: number) => void
  updatePosition: (id: string, x: number, y: number) => void
}

export const useGraphStore = create<GraphStore>()(
  persist(
    (set, get) => ({
      people: SEED_PEOPLE,
      edges: SEED_EDGES,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      hoveredId: null,
      selectedId: null,
      linkSourceId: null,
      searchQuery: '',

      addPerson: (p) => {
        const people = get().people
        const id = String(Date.now())
        const category = getNodeCategory(p.tags)
        const newPerson: Person = {
          ...p,
          id,
          category,
          x: 160 + Math.random() * 320,
          y: 100 + Math.random() * 280,
          r: 14,
        }
        set({ people: [...people, newPerson] })
      },

      updatePerson: (id, patch) => {
        set({
          people: get().people.map((p) =>
            p.id === id
              ? { ...p, ...patch, category: getNodeCategory(patch.tags ?? p.tags) }
              : p
          ),
        })
      },

      deletePerson: (id) => {
        set({
          people: get().people.filter((p) => p.id !== id),
          edges: get().edges.filter((e) => e.source !== id && e.target !== id),
          linkSourceId: get().linkSourceId === id ? null : get().linkSourceId,
        })
      },

      addEdge: (source, target) => {
        if (source === target) return
        const edges = get().edges
        const exists = edges.some(
          (e) =>
            (e.source === source && e.target === target) ||
            (e.source === target && e.target === source)
        )
        if (exists) return
        set({ edges: [...edges, { source, target }], linkSourceId: null })
      },

      removeEdge: (a, b) => {
        set({
          edges: get().edges.filter(
            (e) =>
              !(
                (e.source === a && e.target === b) ||
                (e.source === b && e.target === a)
              )
          ),
        })
      },

      setHovered: (id) => set({ hoveredId: id }),
      setSelected: (id) => set({ selectedId: id }),
      setLinkSource: (id) => set({ linkSourceId: id }),
      setSearch: (q) => set({ searchQuery: q }),

      setViewport: (scale, offsetX, offsetY) =>
        set({ scale, offsetX, offsetY }),

      updatePosition: (id, x, y) => {
        set({
          people: get().people.map((p) => (p.id === id ? { ...p, x, y } : p)),
        })
      },
    }),
    {
      name: 'people-graph-v1',
      partialize: (s) => ({ people: s.people, edges: s.edges }),
    }
  )
)
