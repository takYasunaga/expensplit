import { useEffect, useState } from 'react'
import { fetchExpenses } from '../services/expenseService'
import type { Expense } from '../types'

export type ExpensesState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; expenses: Expense[] }

/**
 * Loads a group's expenses. Change `refreshKey` to refetch (e.g. after an
 * expense is added); the previous result stays visible while it reloads.
 */
export function useExpenses(groupId: string, refreshKey = 0): ExpensesState {
  const [state, setState] = useState<ExpensesState>({ status: 'loading' })

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

  return state
}
