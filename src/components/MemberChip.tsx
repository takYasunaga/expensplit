import type { User } from '../types'
import { Avatar } from './Avatar'

interface MemberChipProps {
  user: User
  /** Position of the user in the group's member list; picks the avatar color. */
  index: number
  selected: boolean
  onToggle: () => void
}

export function MemberChip({ user, index, selected, onToggle }: MemberChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 rounded-full border py-0.5 pr-2.5 pl-0.5 text-xs font-medium transition-colors ${
        selected
          ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'
      }`}
    >
      <span className={selected ? '' : 'opacity-50 grayscale'}>
        <Avatar user={user} index={index} size="xs" />
      </span>
      {user.displayName}
      {selected && <span aria-hidden="true">✓</span>}
    </button>
  )
}
