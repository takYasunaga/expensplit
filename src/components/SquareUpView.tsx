import { useEffect, useState } from 'react'
import { useExpenses } from '../hooks/useExpenses'
import { createSettlement, fetchSettlements } from '../services/expenseService'
import type { SettlementRecord, SettlementTransaction, User } from '../types'
import { calculateSettlement } from '../utils/settlementCalculator'
import { BalanceSummary } from './BalanceSummary'
import { SettlementCard } from './SettlementCard'
import { SettlementHistory } from './SettlementHistory'

interface SquareUpViewProps {
  groupId: string
  members: User[]
  /** Change this value to refetch expenses. */
  refreshKey?: number
}

type SettlementsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; settlements: SettlementRecord[] }

/** Identifies a suggested payment; changes if the amount or people change. */
function transactionKey(transaction: SettlementTransaction): string {
  return `${transaction.fromMemberId}>${transaction.toMemberId}:${transaction.amount}`
}

const HEADING = 'mb-2 text-sm font-semibold tracking-wide text-gray-500 uppercase'

export function SquareUpView({ groupId, members, refreshKey = 0 }: SquareUpViewProps) {
  const expensesState = useExpenses(groupId, refreshKey)
  const [settlementsState, setSettlementsState] = useState<SettlementsState>({ status: 'loading' })
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchSettlements(groupId)
      .then((settlements) => {
        if (!cancelled) setSettlementsState({ status: 'ready', settlements })
      })
      .catch((error: unknown) => {
        console.error('Failed to load settlements:', error)
        if (!cancelled) setSettlementsState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [groupId])

  if (expensesState.status === 'loading' || settlementsState.status === 'loading') {
    return <p className="py-8 text-center text-sm text-gray-500">Calculating balances…</p>
  }

  // Balances would be wrong without either input, so show neither.
  if (expensesState.status === 'error' || settlementsState.status === 'error') {
    return (
      <p role="alert" className="py-8 text-center text-sm text-red-600">
        Couldn’t load {expensesState.status === 'error' ? 'expenses' : 'past payments'}. Check your
        connection and reload.
      </p>
    )
  }

  const { settlements } = settlementsState
  const { balances, transactions } = calculateSettlement(
    members,
    expensesState.expenses,
    settlements,
  )
  const nameOf = (memberId: string) =>
    balances.find((balance) => balance.memberId === memberId)?.name ?? 'Unknown member'

  const markPaid = async (transaction: SettlementTransaction) => {
    if (savingKey) return
    setSavingKey(transactionKey(transaction))
    setSaveError(null)
    try {
      const saved = await createSettlement({ groupId, ...transaction })
      setSettlementsState((prev) =>
        prev.status === 'ready'
          ? { status: 'ready', settlements: [...prev.settlements, saved] }
          : prev,
      )
    } catch (error) {
      console.error('Failed to record settlement:', error)
      setSaveError('Couldn’t mark that payment as paid. Check your connection and try again.')
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="balances-heading">
        <h2 id="balances-heading" className={HEADING}>
          Net balances
        </h2>
        <BalanceSummary balances={balances} />
      </section>

      <section aria-labelledby="payments-heading">
        <h2 id="payments-heading" className={HEADING}>
          Payments to settle up
        </h2>
        {saveError && (
          <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {saveError}
          </p>
        )}
        {transactions.length === 0 ? (
          <p className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            Everyone is settled up. No payments needed.
          </p>
        ) : (
          <ul className="space-y-3">
            {transactions.map((transaction) => {
              const key = transactionKey(transaction)
              return (
                <SettlementCard
                  key={key}
                  transaction={transaction}
                  fromName={nameOf(transaction.fromMemberId)}
                  toName={nameOf(transaction.toMemberId)}
                  isSaving={savingKey === key}
                  disabled={savingKey !== null}
                  onMarkPaid={() => markPaid(transaction)}
                />
              )
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="history-heading">
        <h2 id="history-heading" className={HEADING}>
          Settlement history
        </h2>
        <SettlementHistory settlements={settlements} nameOf={nameOf} />
      </section>
    </div>
  )
}
