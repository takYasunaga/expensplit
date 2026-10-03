import type { Expense, User } from '../types'
import { ExpenseCard } from './ExpenseCard'

interface ExpenseListProps {
  expenses: Expense[]
  members: User[]
}

export function ExpenseList({ expenses, members }: ExpenseListProps) {
  if (expenses.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">No expenses yet.</p>
  }

  return (
    <ul className="space-y-3">
      {expenses.map((expense) => (
        <ExpenseCard key={expense.id} expense={expense} members={members} />
      ))}
    </ul>
  )
}
