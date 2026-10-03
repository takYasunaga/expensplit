import type { User } from '../types'

const COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-800',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-fuchsia-100 text-fuchsia-700',
]

const SIZES = {
  xs: 'size-5 text-[10px]',
  sm: 'size-7 text-xs',
  md: 'size-10 text-sm',
}

interface AvatarProps {
  user: User
  /** Position of the user in the group's member list; picks the color. */
  index: number
  size?: keyof typeof SIZES
}

export function Avatar({ user, index, size = 'md' }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${SIZES[size]} ${COLORS[index % COLORS.length]}`}
    >
      {user.displayName.charAt(0).toUpperCase()}
    </span>
  )
}
