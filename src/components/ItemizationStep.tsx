import { formatCurrency, parseDollarsToCents } from '../lib/money'
import { computeSplit } from '../lib/split'
import type { LineItemDraft, User } from '../types'
import { DollarInput } from './DollarInput'
import { MemberChip } from './MemberChip'
import { SplitSummary } from './SplitSummary'

interface ItemizationStepProps {
  lineItems: LineItemDraft[]
  members: User[]
  /** Overall receipt total in cents, from the overview step. */
  totalCents: number
  /** Quick Equal Split: divide the total across all members, skipping items. */
  splitEqually: boolean
  onToggleSplitEqually: () => void
  onAddItem: () => void
  onUpdateItem: (id: string, changes: Partial<Pick<LineItemDraft, 'name' | 'price'>>) => void
  onRemoveItem: (id: string) => void
  onToggleAssignee: (itemId: string, userId: string) => void
}

export function ItemizationStep({
  lineItems,
  members,
  totalCents,
  splitEqually,
  onToggleSplitEqually,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onToggleAssignee,
}: ItemizationStepProps) {
  const itemsCents = lineItems.reduce((sum, item) => sum + parseDollarsToCents(item.price), 0)
  const difference = totalCents - itemsCents

  const split = computeSplit(
    splitEqually
      ? [{ amount: totalCents, assignedTo: members.map((member) => member.id) }]
      : lineItems.map((item) => ({
          amount: parseDollarsToCents(item.price),
          assignedTo: item.assignedTo,
        })),
  )

  return (
    <div className="space-y-4">
      <button
        type="button"
        role="switch"
        aria-checked={splitEqually}
        onClick={onToggleSplitEqually}
        className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors ${
          splitEqually ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-400'
        }`}
      >
        <span>
          <span className="block text-sm font-medium text-gray-900">Quick Equal Split</span>
          <span className="block text-xs text-gray-500">
            Divide {formatCurrency(totalCents)} evenly across all {members.length} members.
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            splitEqually ? 'bg-indigo-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${
              splitEqually ? 'translate-x-5' : ''
            }`}
          />
        </span>
      </button>

      {!splitEqually && (
        <>
          <ul className="space-y-3">
            {lineItems.map((item, index) => (
              <li key={item.id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Item name"
                    aria-label={`Item ${index + 1} name`}
                    value={item.name}
                    onChange={(event) => onUpdateItem(item.id, { name: event.target.value })}
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  />
                  <div className="w-28 shrink-0">
                    <DollarInput
                      required
                      ariaLabel={`Item ${index + 1} price`}
                      value={item.price}
                      onChange={(price) => onUpdateItem(item.id, { price })}
                    />
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove item ${index + 1}`}
                    onClick={() => onRemoveItem(item.id)}
                    className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div
                  role="group"
                  aria-label={`Who shares item ${index + 1}`}
                  className="mt-2 flex flex-wrap items-center gap-1.5"
                >
                  {members.map((member, memberIndex) => (
                    <MemberChip
                      key={member.id}
                      user={member}
                      index={memberIndex}
                      selected={item.assignedTo.includes(member.id)}
                      onToggle={() => onToggleAssignee(item.id, member.id)}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  {item.assignedTo.length === 0 ? (
                    <span className="text-amber-700">⚠ Tap who had this item.</span>
                  ) : item.assignedTo.length === 1 ? (
                    'Assigned to one person.'
                  ) : (
                    `Split evenly ${item.assignedTo.length} ways.`
                  )}
                </p>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={onAddItem}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            + Add item
          </button>

          <div className="rounded-lg bg-gray-50 p-3 text-sm">
            <div className="flex justify-between font-medium text-gray-900">
              <span>Items total</span>
              <span className="tabular-nums">
                {formatCurrency(itemsCents)} of {formatCurrency(totalCents)}
              </span>
            </div>
            <p
              role="status"
              className={`mt-1 ${
                difference === 0
                  ? 'text-emerald-700'
                  : difference > 0
                    ? 'text-amber-700'
                    : 'text-red-700'
              }`}
            >
              {difference === 0
                ? '✓ Items match the receipt total.'
                : difference > 0
                  ? `⚠ ${formatCurrency(difference)} of the receipt is not itemized yet.`
                  : `⚠ Items are ${formatCurrency(-difference)} over the receipt total.`}
            </p>
          </div>
        </>
      )}

      <SplitSummary members={members} split={split} />
    </div>
  )
}
