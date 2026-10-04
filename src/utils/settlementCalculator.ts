import { computeSplit } from '../lib/split'
import type {
  Expense,
  MemberBalance,
  Settlement,
  SettlementRecord,
  SettlementTransaction,
  User,
} from '../types'

export type { MemberBalance, Settlement, SettlementTransaction }

/**
 * Net balance per member: what they paid minus their share of every line
 * item, adjusted for settlement payments already made between members.
 * Returned in member order, and the net balances always sum to zero.
 *
 * Any part of a receipt that no one is assigned to (an unassigned item, or a
 * total larger than its line items) is charged to the payer.
 */
export function calculateBalances(
  members: User[],
  expenses: Expense[],
  settlements: SettlementTransaction[] = [],
): MemberBalance[] {
  const emptyBalance = (memberId: string, name: string): MemberBalance => ({
    memberId,
    name,
    totalSpent: 0,
    totalOwed: 0,
    totalSettled: 0,
    netBalance: 0,
  })
  const balances = new Map<string, MemberBalance>(
    members.map((member) => [member.id, emptyBalance(member.id, member.displayName)]),
  )
  // Expenses can reference someone who has since left the group.
  const balanceOf = (memberId: string): MemberBalance => {
    let balance = balances.get(memberId)
    if (!balance) {
      balance = emptyBalance(memberId, 'Unknown member')
      balances.set(memberId, balance)
    }
    return balance
  }

  for (const expense of expenses) {
    const { totals } = computeSplit(expense.lineItems)
    let assigned = 0
    for (const [memberId, share] of Object.entries(totals)) {
      balanceOf(memberId).totalOwed += share
      assigned += share
    }
    const payer = balanceOf(expense.payerId)
    payer.totalSpent += expense.totalAmount
    payer.totalOwed += expense.totalAmount - assigned
  }

  for (const settlement of settlements) {
    balanceOf(settlement.fromMemberId).totalSettled += settlement.amount
    balanceOf(settlement.toMemberId).totalSettled -= settlement.amount
  }

  for (const balance of balances.values()) {
    balance.netBalance = balance.totalSpent - balance.totalOwed + balance.totalSettled
  }
  return [...balances.values()]
}

/**
 * Greedy debt simplification: repeatedly has the largest debtor pay the
 * largest creditor as much as possible. Every payment clears at least one
 * person, so N people with open balances need at most N - 1 payments.
 * (Finding the true minimum in every case is NP-hard; this is the standard
 * approximation.) Ties keep the order of `balances`.
 */
export function simplifyDebts(balances: MemberBalance[]): SettlementTransaction[] {
  const debtors = balances
    .filter((balance) => balance.netBalance < 0)
    .map((balance) => ({ memberId: balance.memberId, amount: -balance.netBalance }))
  const creditors = balances
    .filter((balance) => balance.netBalance > 0)
    .map((balance) => ({ memberId: balance.memberId, amount: balance.netBalance }))

  const largest = (entries: { amount: number }[]) =>
    entries.reduce((best, entry, i) => (entry.amount > entries[best].amount ? i : best), 0)

  const transactions: SettlementTransaction[] = []
  while (debtors.length > 0 && creditors.length > 0) {
    const debtorIndex = largest(debtors)
    const creditorIndex = largest(creditors)
    const debtor = debtors[debtorIndex]
    const creditor = creditors[creditorIndex]
    const amount = Math.min(debtor.amount, creditor.amount)

    transactions.push({ fromMemberId: debtor.memberId, toMemberId: creditor.memberId, amount })

    debtor.amount -= amount
    creditor.amount -= amount
    if (debtor.amount === 0) debtors.splice(debtorIndex, 1)
    if (creditor.amount === 0) creditors.splice(creditorIndex, 1)
  }
  return transactions
}

/** Balances plus the simplified payments that settle what is still open. */
export function calculateSettlement(
  members: User[],
  expenses: Expense[],
  settlements: SettlementRecord[] = [],
): Settlement {
  const balances = calculateBalances(members, expenses, settlements)
  return { balances, transactions: simplifyDebts(balances) }
}
