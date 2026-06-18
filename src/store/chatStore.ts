import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatMessage } from '@/types/chat'

interface ChatStore {
  messages: ChatMessage[]
  activePersonId: string | null
  expandedGroupIds: string[]
  sidebarOpen: boolean

  setActivePerson: (id: string | null) => void
  toggleGroupExpanded: (groupId: string) => void
  setSidebarOpen: (open: boolean) => void
  addMessage: (personId: string, content: string) => void
  deleteMessage: (id: string) => void
  messagesFor: (personId: string) => ChatMessage[]
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [],
      activePersonId: null,
      expandedGroupIds: ['g1', 'g2', 'g3'],
      sidebarOpen: true,

      setActivePerson: (id) => set({ activePersonId: id }),

      toggleGroupExpanded: (groupId) => {
        const expanded = get().expandedGroupIds
        set({
          expandedGroupIds: expanded.includes(groupId)
            ? expanded.filter((id) => id !== groupId)
            : [...expanded, groupId],
        })
      },

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      addMessage: (personId, content) => {
        const text = content.trim()
        if (!text) return
        const msg: ChatMessage = {
          id: `m${Date.now()}`,
          personId,
          content: text,
          createdAt: new Date().toISOString(),
        }
        set({ messages: [...get().messages, msg] })
      },

      deleteMessage: (id) =>
        set({ messages: get().messages.filter((m) => m.id !== id) }),

      messagesFor: (personId) =>
        get()
          .messages.filter((m) => m.personId === personId)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    }),
    {
      name: 'people-graph-chats-v1',
      partialize: (s) => ({
        messages: s.messages,
        expandedGroupIds: s.expandedGroupIds,
        sidebarOpen: s.sidebarOpen,
      }),
    }
  )
)
