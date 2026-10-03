import { useState } from 'react'
import { formatCurrency, splitEvenly } from '../lib/money'
import type { Expense, User } from '../types'

interface ExpenseCardProps {
  expense: Expense
  members: User[]
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function ExpenseCard({ expense, members }: ExpenseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const nameOf = (userId: string) =>
    members.find((member) => member.id === userId)?.displayName ?? 'Unknown'
  const payerName = nameOf(expense.payerId)
  const breakdownId = `breakdown-${expense.id}`

  return (
    <li className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={breakdownId}
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 rounded-xl p-4 text-left hover:bg-gray-50"
      >
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-gray-900">{expense.title}</h3>
          <p className="mt-0.5 text-sm text-gray-500">
            Paid by <span className="font-medium text-gray-700">{payerName}</span>
            {' · '}
            {dateFormatter.format(new Date(expense.createdTimestamp))}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-lg font-semibold text-gray-900 tabular-nums">
            {formatCurrency(expense.totalAmount)}
          </span>
          <span
            aria-hidden="true"
            className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          >
            ▾
          </span>
        </div>
      </button>

      {isExpanded && (
        <ul id={breakdownId} className="divide-y divide-gray-100 border-t border-gray-200 px-4">
          {expense.lineItems.map((item) => {
            const shares = splitEvenly(item.amount, item.assignedTo.length)
            return (
              <li key={item.id} className="py-3">
                <div className="flex justify-between gap-4 text-sm font-medium text-gray-900">
                  <span>{item.description}</span>
                  <span className="tabular-nums">{formatCurrency(item.amount)}</span>
                </div>
                <ul className="mt-1 space-y-0.5 text-sm text-gray-600">
                  {item.assignedTo.map((userId, i) => (
                    <li key={userId}>
                      {userId === expense.payerId
                        ? `${payerName} covers their own share of ${formatCurrency(shares[i])}`
                        : `${nameOf(userId)} owes ${payerName} ${formatCurrency(shares[i])} for ${item.description}`}
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}
