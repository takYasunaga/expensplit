import type { Group } from '../types'
import { Avatar } from './Avatar'

interface HeaderProps {
  group: Group
}

export function Header({ group }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-2xl px-4 py-5">
        <h1 className="text-2xl font-semibold text-gray-900">{group.name}</h1>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {group.members.map((member, index) => (
            <li key={member.id} className="flex items-center gap-2">
              <Avatar user={member} index={index} size="sm" />
              <span className="text-sm text-gray-700">{member.displayName}</span>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
