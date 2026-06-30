import type { Person, Edge } from '@/types'
import type { Group } from '@/types/groups'
import type { ChatMessage } from '@/types/chat'
import { useGraphStore } from '@/store/graphStore'
import { useGroupStore } from '@/store/groupStore'
import { useChatStore } from '@/store/chatStore'

export const EXPORT_VERSION = 1

export interface GraphExport {
  version: number
  exportedAt: string
  people: Person[]
  edges: Edge[]
  groups: Group[]
  messages: ChatMessage[]
}

export function buildExport(): GraphExport {
  const { people, edges } = useGraphStore.getState()
  const { groups } = useGroupStore.getState()
  const { messages } = useChatStore.getState()

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    people,
    edges,
    groups,
    messages,
  }
}

export function downloadExport() {
  const data = buildExport()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `people-graph-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function parseImportJson(text: string): GraphExport {
  const data = JSON.parse(text) as GraphExport
  if (!Array.isArray(data.people) || !Array.isArray(data.edges)) {
    throw new Error('Invalid file: missing people or edges')
  }
  return {
    version: data.version ?? 1,
    exportedAt: data.exportedAt ?? new Date().toISOString(),
    people: data.people,
    edges: data.edges,
    groups: Array.isArray(data.groups) ? data.groups : [],
    messages: Array.isArray(data.messages) ? data.messages : [],
  }
}

export function applyImport(data: GraphExport) {
  useGraphStore.getState().replaceGraphData(data.people, data.edges)
  useGroupStore.getState().replaceGroups(data.groups)
  useChatStore.getState().replaceMessages(data.messages)
}
