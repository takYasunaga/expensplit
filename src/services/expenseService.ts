import { supabase } from '../lib/supabase'
import { mockExpenses, mockGroup } from '../mockData'
import type { Expense, Group } from '../types'

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
    if (!data) return mockGroup
    return toGroup(data as GroupRow)
  } catch (error) {
    console.warn('Supabase group query failed, using mock data:', error)
    return mockGroup
  }
}

/**
 * Loads a group's expenses with their line items, oldest first. The mock
 * group always gets the mock expenses. A Supabase group never does, because
 * mock expenses reference mock member ids; its query errors are thrown.
 */
export async function fetchExpenses(groupId: string): Promise<Expense[]> {
  if (!supabase || groupId === mockGroup.id) return mockExpenses

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
