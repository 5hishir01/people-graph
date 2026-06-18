import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Group, GroupFilter, RelationshipStrength } from '@/types/groups'
import { GROUP_PALETTE, STRENGTH_ORDER } from '@/types/groups'

const SEED_GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'AI Skunkworks',
    color: '#1D9E75',
    memberIds: ['1', '2', '3', '4'],
    location: 'NEU',
    connectedAt: '2024-09-01',
    strength: 'close',
    notes: 'Core team — AICR proposal + weekly meetups',
  },
  {
    id: 'g2',
    name: 'H1B targets',
    color: '#EF9F27',
    memberIds: ['5', '6'],
    location: 'Boston',
    connectedAt: '2025-01-01',
    strength: 'active',
    notes: 'Priority employer pipeline',
  },
  {
    id: 'g3',
    name: 'Hackathon network',
    color: '#7F77DD',
    memberIds: ['7'],
    location: 'MLH',
    connectedAt: '2024-11-01',
    strength: 'active',
    notes: 'HackMIT pipeline',
  },
]

interface GroupStore {
  groups: Group[]
  activeFilter: GroupFilter
  hiddenGroupIds: Set<string>

  // CRUD
  addGroup: (g: Omit<Group, 'id'>) => void
  updateGroup: (id: string, patch: Partial<Group>) => void
  deleteGroup: (id: string) => void
  addMember: (groupId: string, personId: string) => void
  removeMember: (groupId: string, personId: string) => void

  // filter + visibility
  setFilter: (f: GroupFilter) => void
  clearFilter: () => void
  toggleGroupVisibility: (id: string) => void

  // derived
  visibleGroups: () => Group[]
}

export const useGroupStore = create<GroupStore>()(
  persist(
    (set, get) => ({
      groups: SEED_GROUPS,
      activeFilter: {},
      hiddenGroupIds: new Set(),

      addGroup: (g) => {
        const usedColors = get().groups.map(gr => gr.color)
        const color = g.color || GROUP_PALETTE.find(c => !usedColors.includes(c)) || GROUP_PALETTE[0]
        set({ groups: [...get().groups, { ...g, id: `g${Date.now()}`, color }] })
      },

      updateGroup: (id, patch) =>
        set({ groups: get().groups.map(g => g.id === id ? { ...g, ...patch } : g) }),

      deleteGroup: (id) =>
        set({ groups: get().groups.filter(g => g.id !== id) }),

      addMember: (groupId, personId) =>
        set({
          groups: get().groups.map(g =>
            g.id === groupId && !g.memberIds.includes(personId)
              ? { ...g, memberIds: [...g.memberIds, personId] }
              : g
          ),
        }),

      removeMember: (groupId, personId) =>
        set({
          groups: get().groups.map(g =>
            g.id === groupId
              ? { ...g, memberIds: g.memberIds.filter(id => id !== personId) }
              : g
          ),
        }),

      setFilter: (f) => set({ activeFilter: { ...get().activeFilter, ...f } }),
      clearFilter: () => set({ activeFilter: {} }),

      toggleGroupVisibility: (id) => {
        const next = new Set(get().hiddenGroupIds)
        next.has(id) ? next.delete(id) : next.add(id)
        set({ hiddenGroupIds: next })
      },

      visibleGroups: () => {
        const { groups, activeFilter, hiddenGroupIds } = get()
        return groups.filter(g => {
          if (hiddenGroupIds.has(g.id)) return false
          if (activeFilter.location && g.location !== activeFilter.location) return false
          if (activeFilter.after && g.connectedAt && g.connectedAt < activeFilter.after) return false
          if (activeFilter.before && g.connectedAt && g.connectedAt > activeFilter.before) return false
          if (activeFilter.strengthMin && g.strength) {
            const minIdx = STRENGTH_ORDER.indexOf(activeFilter.strengthMin as RelationshipStrength)
            const gIdx   = STRENGTH_ORDER.indexOf(g.strength)
            if (gIdx > minIdx) return false
          }
          return true
        })
      },
    }),
    {
      name: 'people-graph-groups-v1',
      partialize: (s) => ({ groups: s.groups }),
      merge: (persisted: unknown, current) => ({
        ...current,
        ...(persisted as object),
        hiddenGroupIds: new Set(),
        activeFilter: {},
      }),
    }
  )
)
