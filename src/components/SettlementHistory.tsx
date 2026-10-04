import { formatCurrency } from '../lib/money'
import type { SettlementRecord } from '../types'

interface SettlementHistoryProps {
  settlements: SettlementRecord[]
  nameOf: (memberId: string) => string
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export function SettlementHistory({ settlements, nameOf }: SettlementHistoryProps) {
  if (settlements.length === 0) {
    return (
      <p className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
        No payments have been marked as paid yet.
      </p>
    )
  }

  // Newest first.
  const ordered = [...settlements].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
      {ordered.map((settlement) => (
        <li key={settlement.id} className="flex items-center justify-between gap-4 p-4">
          <div className="min-w-0">
            <p className="text-gray-700">
              <span aria-hidden="true" className="mr-1.5 text-emerald-600">
                ✓
              </span>
              <span className="font-medium text-gray-900">{nameOf(settlement.fromMemberId)}</span>{' '}
              paid{' '}
              <span className="font-medium text-gray-900">{nameOf(settlement.toMemberId)}</span>
            </p>
            <p className="text-xs text-gray-500">
              {dateFormatter.format(new Date(settlement.createdAt))}
            </p>
          </div>
          <span className="shrink-0 font-semibold text-gray-900 tabular-nums">
            {formatCurrency(settlement.amount)}
          </span>
        </li>
      ))}
    </ul>
  )
}
