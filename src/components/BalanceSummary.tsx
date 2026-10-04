import { formatCurrency } from '../lib/money'
import type { MemberBalance } from '../types'
import { Avatar } from './Avatar'

interface BalanceSummaryProps {
  balances: MemberBalance[]
}

function BalanceBadge({ netBalance }: { netBalance: number }) {
  const [style, label] =
    netBalance > 0
      ? ['bg-emerald-100 text-emerald-800', `Gets back ${formatCurrency(netBalance)}`]
      : netBalance < 0
        ? ['bg-red-100 text-red-800', `Owes ${formatCurrency(-netBalance)}`]
        : ['bg-gray-100 text-gray-600', 'Settled up']
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold tabular-nums ${style}`}>
      {label}
    </span>
  )
}

export function BalanceSummary({ balances }: BalanceSummaryProps) {
  return (
    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
      {balances.map((balance, index) => (
        <li key={balance.memberId} className="flex items-center gap-3 p-4">
          <Avatar user={{ id: balance.memberId, displayName: balance.name }} index={index} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-gray-900">{balance.name}</p>
            <p className="text-xs text-gray-500 tabular-nums">
              Paid {formatCurrency(balance.totalSpent)} · Share {formatCurrency(balance.totalOwed)}
              {balance.totalSettled > 0 && ` · Settled ${formatCurrency(balance.totalSettled)}`}
              {balance.totalSettled < 0 && ` · Received ${formatCurrency(-balance.totalSettled)}`}
            </p>
          </div>
          <BalanceBadge netBalance={balance.netBalance} />
        </li>
      ))}
    </ul>
  )
}
