import { useGroupStore } from '@/store/groupStore'
import type { RelationshipStrength } from '@/types/groups'
import { STRENGTH_ORDER } from '@/types/groups'

const LOCATIONS = ['NEU', 'MLH', 'AI Skunkworks', 'Online', 'Boston', 'Hyderabad']

const STRENGTH_LABELS: Record<RelationshipStrength, string> = {
  close:   'Close',
  active:  'Active',
  dormant: 'Dormant',
}

export function FilterBar() {
  const { activeFilter, setFilter, clearFilter, groups } = useGroupStore()
  const hasFilter = Object.values(activeFilter).some(Boolean)

  const uniqueLocations = [...new Set([
    ...LOCATIONS,
    ...groups.map(g => g.location).filter(Boolean) as string[],
  ])]

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Location */}
      <select
        className="input h-7 text-xs py-0 pr-6 w-auto min-w-[100px]"
        value={activeFilter.location ?? ''}
        onChange={e => setFilter({ location: e.target.value || undefined })}
      >
        <option value="">All locations</option>
        {uniqueLocations.map(l => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>

      {/* Relationship strength */}
      <select
        className="input h-7 text-xs py-0 pr-6 w-auto min-w-[110px]"
        value={activeFilter.strengthMin ?? ''}
        onChange={e => setFilter({ strengthMin: (e.target.value as RelationshipStrength) || undefined })}
      >
        <option value="">Any strength</option>
        {STRENGTH_ORDER.map(s => (
          <option key={s} value={s}>{STRENGTH_LABELS[s]}+</option>
        ))}
      </select>

      {/* Connected after */}
      <input
        type="month"
        className="input h-7 text-xs py-0 w-auto"
        value={activeFilter.after?.slice(0, 7) ?? ''}
        onChange={e => setFilter({ after: e.target.value ? e.target.value + '-01' : undefined })}
        title="Connected after"
      />

      {/* Clear */}
      {hasFilter && (
        <button
          onClick={clearFilter}
          className="btn h-7 text-xs px-2 text-red-400 border-red-400/30 hover:border-red-400"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
