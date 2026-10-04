import { formatCurrency } from '../lib/money'
import type { SettlementTransaction } from '../types'

interface SettlementCardProps {
  transaction: SettlementTransaction
  fromName: string
  toName: string
  /** True while this payment is being recorded. */
  isSaving: boolean
  /** Disables the button, e.g. while another payment is being recorded. */
  disabled: boolean
  onMarkPaid: () => void
}

export function SettlementCard({
  transaction,
  fromName,
  toName,
  isSaving,
  disabled,
  onMarkPaid,
}: SettlementCardProps) {
  return (
    <li className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-gray-700">
        <span className="font-semibold text-gray-900">{fromName}</span> pays{' '}
        <span className="font-semibold text-gray-900">{toName}</span>{' '}
        <span className="text-lg font-semibold text-gray-900 tabular-nums">
          {formatCurrency(transaction.amount)}
        </span>
      </p>
      <button
        type="button"
        disabled={disabled || isSaving}
        onClick={onMarkPaid}
        className="shrink-0 rounded-lg border border-indigo-600 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent"
      >
        {isSaving ? 'Saving…' : 'Mark as Paid'}
      </button>
    </li>
  )
}
