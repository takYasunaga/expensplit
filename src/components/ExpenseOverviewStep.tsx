import type { ExpenseDraft, User } from '../types'
import { DollarInput } from './DollarInput'

type OverviewFields = Pick<ExpenseDraft, 'title' | 'totalAmount' | 'date' | 'payerId'>

interface ExpenseOverviewStepProps {
  draft: ExpenseDraft
  members: User[]
  onChange: (changes: Partial<OverviewFields>) => void
}

const LABEL = 'mb-1 block text-sm font-medium text-gray-700'
const FIELD =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none'

export function ExpenseOverviewStep({ draft, members, onChange }: ExpenseOverviewStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="expense-title" className={LABEL}>
          Title / Merchant name
        </label>
        <input
          id="expense-title"
          type="text"
          required
          autoFocus
          placeholder="Dinner at Izakaya"
          value={draft.title}
          onChange={(event) => onChange({ title: event.target.value })}
          className={FIELD}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="expense-total" className={LABEL}>
            Total amount
          </label>
          <DollarInput
            id="expense-total"
            required
            value={draft.totalAmount}
            onChange={(totalAmount) => onChange({ totalAmount })}
          />
        </div>
        <div>
          <label htmlFor="expense-date" className={LABEL}>
            Date
          </label>
          <input
            id="expense-date"
            type="date"
            required
            value={draft.date}
            onChange={(event) => onChange({ date: event.target.value })}
            className={FIELD}
          />
        </div>
      </div>

      <div>
        <label htmlFor="expense-payer" className={LABEL}>
          Who paid?
        </label>
        <select
          id="expense-payer"
          required
          value={draft.payerId}
          onChange={(event) => onChange({ payerId: event.target.value })}
          className={FIELD}
        >
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.displayName}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
