import { useEffect, useState } from 'react'
import { fetchExpenses } from '../services/expenseService'
import type { Expense, User } from '../types'
import { ExpenseCard } from './ExpenseCard'

interface ExpenseListProps {
  groupId: string
  members: User[]
  /** Change this value to refetch, e.g. after an expense is added. */
  refreshKey?: number
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; expenses: Expense[] }

export function ExpenseList({ groupId, members, refreshKey = 0 }: ExpenseListProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    fetchExpenses(groupId)
      .then((expenses) => {
        if (!cancelled) setState({ status: 'ready', expenses })
      })
      .catch((error: unknown) => {
        console.error('Failed to load expenses:', error)
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [groupId, refreshKey])

  if (state.status === 'loading') {
    return <p className="py-8 text-center text-sm text-gray-500">Loading expenses…</p>
  }

  if (state.status === 'error') {
    return (
      <p role="alert" className="py-8 text-center text-sm text-red-600">
        Couldn’t load expenses. Check your connection and reload.
      </p>
    )
  }

  if (state.expenses.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">No expenses yet.</p>
  }

  return (
    <ul className="space-y-3">
      {state.expenses.map((expense) => (
        <ExpenseCard key={expense.id} expense={expense} members={members} />
      ))}
    </ul>
  )
}
