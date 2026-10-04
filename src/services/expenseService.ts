import { supabase } from '../lib/supabase'
import { mockExpenses, mockGroup } from '../mockData'
import type {
  Expense,
  Group,
  NewExpense,
  NewSettlementRecord,
  SettlementRecord,
} from '../types'

// Offline stand-ins for the database tables; additions last until the page reloads.
let localExpenses: Expense[] = mockExpenses
let localSettlements: SettlementRecord[] = []

interface GroupRow {
  id: string
  name: string
  invite_code: string
  group_members: { id: string; display_name: string }[]
}

interface ExpenseRow {
  id: string
  group_id: string
  title: string
  payer_id: string
  total_amount: number
  receipt_image: string | null
  created_timestamp: string
  line_items: {
    id: string
    position: number
    description: string
    amount: number
    assigned_to: string[]
  }[]
}

interface SettlementRow {
  id: string
  group_id: string
  from_user_id: string
  to_user_id: string
  amount: number
  created_at: string
}

const SETTLEMENT_COLUMNS = 'id, group_id, from_user_id, to_user_id, amount, created_at'

function toSettlementRecord(row: SettlementRow): SettlementRecord {
  return {
    id: row.id,
    groupId: row.group_id,
    fromMemberId: row.from_user_id,
    toMemberId: row.to_user_id,
    amount: row.amount,
    createdAt: row.created_at,
  }
}

function toGroup(row: GroupRow): Group {
  return {
    id: row.id,
    name: row.name,
    inviteCode: row.invite_code,
    members: row.group_members.map((member) => ({
      id: member.id,
      displayName: member.display_name,
    })),
  }
}

function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    groupId: row.group_id,
    title: row.title,
    payerId: row.payer_id,
    totalAmount: row.total_amount,
    receiptImage: row.receipt_image ?? undefined,
    lineItems: [...row.line_items]
      .sort((a, b) => a.position - b.position)
      .map((item) => ({
        id: item.id,
        description: item.description,
        amount: item.amount,
        assignedTo: item.assigned_to,
      })),
    createdTimestamp: row.created_timestamp,
  }
}

/** True when the group is the local sample data rather than a Supabase row. */
export function isMockGroup(group: Group): boolean {
  return group.id === mockGroup.id
}

/**
 * Loads the current group (the earliest-created one, until group selection
 * exists) with its members. Falls back to the mock group if Supabase is not
 * configured, the query fails, or there are no groups.
 */
export async function fetchGroup(): Promise<Group> {
  if (!supabase) return mockGroup

  try {
    const { data, error } = await supabase
      .from('groups')
      .select('id, name, invite_code, group_members(id, display_name)')
      .order('created_at')
      .order('created_at', { referencedTable: 'group_members' })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    if (!data) {
      console.warn(
        '[supabase] Connected, but the groups table is empty. Using sample data. ' +
          'Run supabase/schema.sql to seed it.',
      )
      return mockGroup
    }
    return toGroup(data as GroupRow)
  } catch (error) {
    console.warn('[supabase] Group query failed. Using sample data:', error)
    return mockGroup
  }
}

/**
 * Loads a group's expenses with their line items, oldest first. The mock
 * group always gets the local mock expenses. A Supabase group never does, because
 * mock expenses reference mock member ids; its query errors are thrown.
 */
export async function fetchExpenses(groupId: string): Promise<Expense[]> {
  if (!supabase || groupId === mockGroup.id) return localExpenses

  const { data, error } = await supabase
    .from('expenses')
    .select(
      'id, group_id, title, payer_id, total_amount, receipt_image, created_timestamp, line_items(id, position, description, amount, assigned_to)',
    )
    .eq('group_id', groupId)
    .order('created_timestamp')

  if (error) throw error
  return (data as ExpenseRow[]).map(toExpense)
}

/**
 * Saves an expense and its line items to Supabase and returns the saved
 * expense. For the mock group it is only kept in memory. Throws if a write
 * fails; a half-saved expense is removed again.
 */
export async function createExpense(expense: NewExpense): Promise<Expense> {
  if (!supabase || expense.groupId === mockGroup.id) {
    const saved: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      lineItems: expense.lineItems.map((item) => ({ ...item, id: crypto.randomUUID() })),
    }
    localExpenses = [...localExpenses, saved]
    return saved
  }

  const { data: expenseRow, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      group_id: expense.groupId,
      title: expense.title,
      payer_id: expense.payerId,
      total_amount: expense.totalAmount,
      receipt_image: expense.receiptImage ?? null,
      created_timestamp: expense.createdTimestamp,
    })
    .select('id')
    .single()

  if (expenseError) throw expenseError
  const expenseId = (expenseRow as { id: string }).id

  const { data: itemRows, error: itemsError } = await supabase
    .from('line_items')
    .insert(
      expense.lineItems.map((item, position) => ({
        expense_id: expenseId,
        position,
        description: item.description,
        amount: item.amount,
        assigned_to: item.assignedTo,
      })),
    )
    .select('id, position')

  if (itemsError) {
    // The two inserts are not one transaction, so undo the first by hand.
    const { error: cleanupError } = await supabase.from('expenses').delete().eq('id', expenseId)
    if (cleanupError) console.error('Could not remove half-saved expense:', cleanupError)
    throw itemsError
  }

  const idByPosition = new Map(
    (itemRows as { id: string; position: number }[]).map((row) => [row.position, row.id]),
  )
  return {
    ...expense,
    id: expenseId,
    lineItems: expense.lineItems.map((item, position) => ({
      ...item,
      id: idByPosition.get(position) ?? crypto.randomUUID(),
    })),
  }
}

/** Loads a group's recorded settlement payments, oldest first. Throws on failure. */
export async function fetchSettlements(groupId: string): Promise<SettlementRecord[]> {
  if (!supabase || groupId === mockGroup.id) {
    return localSettlements.filter((settlement) => settlement.groupId === groupId)
  }

  const { data, error } = await supabase
    .from('settlements')
    .select(SETTLEMENT_COLUMNS)
    .eq('group_id', groupId)
    .order('created_at')

  if (error) throw error
  return (data as SettlementRow[]).map(toSettlementRecord)
}

/**
 * Records a payment between two members and returns the saved record. For the
 * mock group it is only kept in memory. Throws if the write fails.
 */
export async function createSettlement(settlement: NewSettlementRecord): Promise<SettlementRecord> {
  if (!supabase || settlement.groupId === mockGroup.id) {
    const saved: SettlementRecord = {
      ...settlement,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    localSettlements = [...localSettlements, saved]
    return saved
  }

  const { data, error } = await supabase
    .from('settlements')
    .insert({
      group_id: settlement.groupId,
      from_user_id: settlement.fromMemberId,
      to_user_id: settlement.toMemberId,
      amount: settlement.amount,
    })
    .select(SETTLEMENT_COLUMNS)
    .single()

  if (error) throw error
  return toSettlementRecord(data as SettlementRow)
}
