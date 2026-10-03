import { formatCurrency } from '../lib/money'
import type { SplitResult } from '../lib/split'
import type { User } from '../types'
import { Avatar } from './Avatar'

interface SplitSummaryProps {
  members: User[]
  split: SplitResult
}

export function SplitSummary({ members, split }: SplitSummaryProps) {
  return (
    <section aria-labelledby="split-summary-title" className="rounded-lg border border-gray-200 p-3">
      <h3 id="split-summary-title" className="text-sm font-medium text-gray-900">
        Each person’s total
      </h3>
      <ul className="mt-2 space-y-1.5 text-sm">
        {members.map((member, index) => (
          <li key={member.id} className="flex items-center gap-2">
            <Avatar user={member} index={index} size="xs" />
            <span className="flex-1 text-gray-700">{member.displayName}</span>
            <span className="font-medium text-gray-900 tabular-nums">
              {formatCurrency(split.totals[member.id] ?? 0)}
            </span>
          </li>
        ))}
        {split.unassigned > 0 && (
          <li className="flex justify-between border-t border-gray-100 pt-1.5 text-amber-700">
            <span>⚠ Not assigned to anyone</span>
            <span className="font-medium tabular-nums">{formatCurrency(split.unassigned)}</span>
          </li>
        )}
      </ul>
    </section>
  )
}
