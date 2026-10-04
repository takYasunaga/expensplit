// Data models from PRD.md Section 2.
// All monetary amounts are integer cents to avoid floating-point drift.

export interface User {
  id: string
  displayName: string
}

export interface Group {
  id: string
  name: string
  inviteCode: string
  members: User[]
}

export interface LineItem {
  id: string
  description: string
  /** Price of the item in cents, including its share of tax/tip. */
  amount: number
  /** Member IDs responsible for this item; cost is split evenly among them. */
  assignedTo: string[]
}

export interface Expense {
  id: string
  groupId: string
  /** Merchant name or short label shown in the ledger. */
  title: string
  /** Member who paid upfront. */
  payerId: string
  /** Total cost of the receipt in cents; equals the sum of lineItems. */
  totalAmount: number
  /** URL of the uploaded receipt image. */
  receiptImage?: string
  lineItems: LineItem[]
  /** ISO 8601 date/time of entry. */
  createdTimestamp: string
}

/** An expense that has not been saved yet, so nothing has an id. */
export interface NewExpense extends Omit<Expense, 'id' | 'lineItems'> {
  lineItems: Omit<LineItem, 'id'>[]
}

/** PRD calls this the "Payment Object". */
export type PaymentObject = Expense

/** One member's position across all of a group's expenses, in cents. */
export interface MemberBalance {
  memberId: string
  name: string
  /** Total the member paid upfront. */
  totalSpent: number
  /** Total of the member's shares across all line items. */
  totalOwed: number
  /** Settlement payments made minus settlement payments received. */
  totalSettled: number
  /**
   * totalSpent - totalOwed + totalSettled: positive = is owed money,
   * negative = owes money.
   */
  netBalance: number
}

/** A single "who owes who" payment, in cents. */
export interface SettlementTransaction {
  fromMemberId: string
  toMemberId: string
  amount: number
}

/** A recorded payment between two members ("Mark as Paid"), in cents. */
export interface SettlementRecord extends SettlementTransaction {
  id: string
  groupId: string
  /** ISO 8601 date/time the payment was marked as paid. */
  createdAt: string
}

export type NewSettlementRecord = Omit<SettlementRecord, 'id' | 'createdAt'>

export interface Settlement {
  /** Calculated Balance: aggregate net balance for each member. */
  balances: MemberBalance[]
  /** Optimal Settlement: simplified payments that settle every balance. */
  transactions: SettlementTransaction[]
}

/** A line item being typed into the Add Expense form; not yet validated. */
export interface LineItemDraft {
  id: string
  name: string
  /** Raw dollar input, e.g. "12.50". */
  price: string
  /** Member IDs sharing this item, kept in group member order. */
  assignedTo: string[]
}

/** Add Expense form state. Amounts are raw dollar input strings. */
export interface ExpenseDraft {
  title: string
  totalAmount: string
  /** Local calendar date as YYYY-MM-DD. */
  date: string
  payerId: string
  /** Quick Equal Split: divide the total across all members, ignoring lineItems. */
  splitEqually: boolean
  lineItems: LineItemDraft[]
}
