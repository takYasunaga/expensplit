import { describe, expect, it } from 'vitest'
import { mockExpenses, mockUsers } from '../mockData'
import type { Expense, MemberBalance, SettlementTransaction, User } from '../types'
import { calculateBalances, calculateSettlement, simplifyDebts } from './settlementCalculator'

const amy: User = { id: 'amy', displayName: 'Amy' }
const bob: User = { id: 'bob', displayName: 'Bob' }
const tony: User = { id: 'tony', displayName: 'Tony' }

function expense(payerId: string, items: [amount: number, assignedTo: string[]][]): Expense {
  return {
    id: crypto.randomUUID(),
    groupId: 'group',
    title: 'Test',
    payerId,
    totalAmount: items.reduce((sum, [amount]) => sum + amount, 0),
    lineItems: items.map(([amount, assignedTo], i) => ({
      id: `item-${i}`,
      description: `Item ${i}`,
      amount,
      assignedTo,
    })),
    createdTimestamp: '2026-04-12T12:00:00Z',
  }
}

const netSum = (balances: MemberBalance[]) =>
  balances.reduce((sum, balance) => sum + balance.netBalance, 0)

/** Applies the payments to the balances; everyone should end at zero. */
function settle(balances: MemberBalance[], transactions: SettlementTransaction[]) {
  const remaining = new Map(balances.map((balance) => [balance.memberId, balance.netBalance]))
  for (const { fromMemberId, toMemberId, amount } of transactions) {
    remaining.set(fromMemberId, remaining.get(fromMemberId)! + amount)
    remaining.set(toMemberId, remaining.get(toMemberId)! - amount)
  }
  return [...remaining.values()]
}

describe('calculateBalances', () => {
  it('computes spent, owed and net for the mock Tokyo trip', () => {
    expect(calculateBalances(mockUsers, mockExpenses)).toEqual([
      { memberId: 'user-bob', name: 'Bob', totalSpent: 12400, totalOwed: 4284, totalSettled: 0, netBalance: 8116 },
      { memberId: 'user-amy', name: 'Amy', totalSpent: 8600, totalOwed: 5383, totalSettled: 0, netBalance: 3217 },
      { memberId: 'user-tony', name: 'Tony', totalSpent: 0, totalOwed: 6383, totalSettled: 0, netBalance: -6383 },
      { memberId: 'user-sarah', name: 'Sarah', totalSpent: 0, totalOwed: 4950, totalSettled: 0, netBalance: -4950 },
    ])
  })

  it('is zero-sum, including splits that do not divide evenly', () => {
    expect(netSum(calculateBalances(mockUsers, mockExpenses))).toBe(0)

    const uneven = [expense('amy', [[1000, ['amy', 'bob', 'tony']]])]
    const balances = calculateBalances([amy, bob, tony], uneven)
    expect(balances.map((balance) => balance.totalOwed)).toEqual([334, 333, 333])
    expect(netSum(balances)).toBe(0)
  })

  it('returns all-zero balances when there are no expenses', () => {
    const balances = calculateBalances([amy, bob], [])
    expect(balances.every((balance) => balance.netBalance === 0)).toBe(true)
  })

  it('charges unassigned items to the payer so the result stays zero-sum', () => {
    const balances = calculateBalances(
      [amy, bob],
      [expense('amy', [[600, ['bob']], [400, []]])],
    )
    expect(balances).toEqual([
      { memberId: 'amy', name: 'Amy', totalSpent: 1000, totalOwed: 400, totalSettled: 0, netBalance: 600 },
      { memberId: 'bob', name: 'Bob', totalSpent: 0, totalOwed: 600, totalSettled: 0, netBalance: -600 },
    ])
  })

  it('keeps a balance for someone no longer in the member list', () => {
    const balances = calculateBalances([amy], [expense('amy', [[500, ['gone']]])])
    expect(balances).toContainEqual({
      memberId: 'gone',
      name: 'Unknown member',
      totalSpent: 0,
      totalOwed: 500,
      totalSettled: 0,
      netBalance: -500,
    })
    expect(netSum(balances)).toBe(0)
  })
})

describe('settlement payments', () => {
  const tonyPaysBob = { fromMemberId: 'user-tony', toMemberId: 'user-bob', amount: 6383 }

  it('moves the payer toward zero and the recipient down by the same amount', () => {
    const balances = calculateBalances(mockUsers, mockExpenses, [tonyPaysBob])
    expect(
      balances.map((balance) => [balance.name, balance.totalSettled, balance.netBalance]),
    ).toEqual([
      ['Bob', -6383, 1733],
      ['Amy', 0, 3217],
      ['Tony', 6383, 0],
      ['Sarah', 0, -4950],
    ])
    expect(netSum(balances)).toBe(0)
  })

  it('drops a paid transaction from the remaining payments', () => {
    const { transactions } = calculateSettlement(mockUsers, mockExpenses, [
      { ...tonyPaysBob, id: 's1', groupId: 'group-tokyo-2026', createdAt: '2026-04-14T00:00:00Z' },
    ])
    expect(transactions).toEqual([
      { fromMemberId: 'user-sarah', toMemberId: 'user-amy', amount: 3217 },
      { fromMemberId: 'user-sarah', toMemberId: 'user-bob', amount: 1733 },
    ])
  })

  it('leaves nothing to pay once every suggested payment is recorded', () => {
    const { transactions: suggested } = calculateSettlement(mockUsers, mockExpenses)
    const balances = calculateBalances(mockUsers, mockExpenses, suggested)
    expect(balances.every((balance) => balance.netBalance === 0)).toBe(true)
    expect(simplifyDebts(balances)).toEqual([])
  })
})

describe('simplifyDebts', () => {
  it('settles the mock Tokyo trip in three payments', () => {
    const { balances, transactions } = calculateSettlement(mockUsers, mockExpenses)
    expect(transactions).toEqual([
      { fromMemberId: 'user-tony', toMemberId: 'user-bob', amount: 6383 },
      { fromMemberId: 'user-sarah', toMemberId: 'user-amy', amount: 3217 },
      { fromMemberId: 'user-sarah', toMemberId: 'user-bob', amount: 1733 },
    ])
    expect(settle(balances, transactions).every((value) => value === 0)).toBe(true)
  })

  it('collapses a chain: Amy owes Bob $10, Bob owes Tony $10 -> Amy pays Tony $10', () => {
    const { transactions } = calculateSettlement(
      [amy, bob, tony],
      [expense('bob', [[1000, ['amy']]]), expense('tony', [[1000, ['bob']]])],
    )
    expect(transactions).toEqual([{ fromMemberId: 'amy', toMemberId: 'tony', amount: 1000 }])
  })

  it('cancels debts that offset each other', () => {
    const { transactions } = calculateSettlement(
      [amy, bob],
      [expense('amy', [[800, ['bob']]]), expense('bob', [[800, ['amy']]])],
    )
    expect(transactions).toEqual([])
  })

  it('never needs more than N - 1 positive payments and clears every balance', () => {
    const balances: MemberBalance[] = [700, -150, 425, -900, -75].map((netBalance, i) => ({
      memberId: `m${i}`,
      name: `M${i}`,
      totalSpent: 0,
      totalOwed: 0,
      totalSettled: 0,
      netBalance,
    }))
    const transactions = simplifyDebts(balances)
    expect(transactions.length).toBeLessThanOrEqual(balances.length - 1)
    expect(transactions.every((transaction) => transaction.amount > 0)).toBe(true)
    expect(settle(balances, transactions).every((value) => value === 0)).toBe(true)
  })
})
