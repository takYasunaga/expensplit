import type { User } from '../types'
import { Avatar } from './Avatar'

interface MemberListProps {
  members: User[]
}

export function MemberList({ members }: MemberListProps) {
  return (
    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
      {members.map((member, index) => (
        <li key={member.id} className="flex items-center gap-3 p-4">
          <Avatar user={member} index={index} />
          <span className="font-medium text-gray-900">{member.displayName}</span>
        </li>
      ))}
    </ul>
  )
}
