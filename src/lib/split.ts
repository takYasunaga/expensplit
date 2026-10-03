import { splitEvenly } from './money'

interface SplittableItem {
  /** Item price in cents. */
  amount: number
  assignedTo: string[]
}

export interface SplitResult {
  /** Cents owed per member ID. Members with nothing assigned are absent. */
  totals: Record<string, number>
  /** Cents on items that nobody is assigned to. */
  unassigned: number
}

/** Adds up each member's share, splitting every item evenly among its assignees. */
export function computeSplit(items: SplittableItem[]): SplitResult {
  const result: SplitResult = { totals: {}, unassigned: 0 }
  for (const item of items) {
    if (item.assignedTo.length === 0) {
      result.unassigned += item.amount
      continue
    }
    const shares = splitEvenly(item.amount, item.assignedTo.length)
    item.assignedTo.forEach((userId, i) => {
      result.totals[userId] = (result.totals[userId] ?? 0) + shares[i]
    })
  }
  return result
}
