import { useEffect, useRef, useState, type FormEvent } from 'react'
import { parseDollarsToCents } from '../lib/money'
import { createExpense } from '../services/expenseService'
import type { ExpenseDraft, LineItemDraft, NewExpense, User } from '../types'
import { ExpenseOverviewStep } from './ExpenseOverviewStep'
import { ItemizationStep } from './ItemizationStep'

interface AddExpenseModalProps {
  groupId: string
  members: User[]
  /** Preselected in "Who paid?". */
  currentUserId: string
  onClose: () => void
  /** Called after the expense has been saved, before the modal closes. */
  onSaved: () => void
}

type Step = 'overview' | 'itemization'

function newLineItem(): LineItemDraft {
  return { id: crypto.randomUUID(), name: '', price: '', assignedTo: [] }
}

/** Today's local date as YYYY-MM-DD, the format <input type="date"> expects. */
function todayLocal(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function toNewExpense(draft: ExpenseDraft, groupId: string, members: User[]): NewExpense {
  const totalAmount = parseDollarsToCents(draft.totalAmount)
  return {
    groupId,
    title: draft.title.trim(),
    payerId: draft.payerId,
    totalAmount,
    // Today's expenses keep the current time; other dates are stored as local noon.
    createdTimestamp: (draft.date === todayLocal()
      ? new Date()
      : new Date(`${draft.date}T12:00:00`)
    ).toISOString(),
    lineItems: draft.splitEqually
      ? [
          {
            description: 'Equal split',
            amount: totalAmount,
            assignedTo: members.map((member) => member.id),
          },
        ]
      : draft.lineItems.map((item) => ({
          description: item.name.trim(),
          amount: parseDollarsToCents(item.price),
          assignedTo: item.assignedTo,
        })),
  }
}

/** Mount to open; unmount to discard the form. */
export function AddExpenseModal({
  groupId,
  members,
  currentUserId,
  onClose,
  onSaved,
}: AddExpenseModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [step, setStep] = useState<Step>('overview')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [draft, setDraft] = useState<ExpenseDraft>(() => ({
    title: '',
    totalAmount: '',
    date: todayLocal(),
    payerId: currentUserId,
    splitEqually: false,
    lineItems: [newLineItem()],
  }))

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const totalCents = parseDollarsToCents(draft.totalAmount)
  const itemsCents = draft.lineItems.reduce(
    (sum, item) => sum + parseDollarsToCents(item.price),
    0,
  )
  const canFinish = draft.splitEqually
    ? totalCents > 0
    : draft.lineItems.length > 0 &&
      itemsCents === totalCents &&
      draft.lineItems.every((item) => item.assignedTo.length > 0)

  const updateItem = (id: string, changes: Partial<Omit<LineItemDraft, 'id'>>) =>
    setDraft((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    }))

  const toggleAssignee = (itemId: string, userId: string) =>
    setDraft((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) => {
        if (item.id !== itemId) return item
        const isAssigned = item.assignedTo.includes(userId)
        // Rebuild from members so the list stays in group member order.
        const assignedTo = members
          .map((member) => member.id)
          .filter((id) => (id === userId ? !isAssigned : item.assignedTo.includes(id)))
        return { ...item, assignedTo }
      }),
    }))

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (step === 'overview') {
      setStep('itemization')
      return
    }
    if (isSaving) return

    setIsSaving(true)
    setSaveError(null)
    try {
      await createExpense(toNewExpense(draft, groupId, members))
    } catch (error) {
      console.error('Failed to save expense:', error)
      setSaveError('Couldn’t save the expense. Check your connection and try again.')
      setIsSaving(false)
      return
    }
    onSaved()
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="add-expense-title"
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl bg-white p-0 text-gray-900 shadow-xl backdrop:bg-gray-900/50"
    >
      <form onSubmit={handleSubmit}>
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <div>
            <h2 id="add-expense-title" className="text-lg font-semibold">
              Add expense
            </h2>
            <p className="text-sm text-gray-500">
              Step {step === 'overview' ? 1 : 2} of 2 ·{' '}
              {step === 'overview' ? 'Overview' : 'Items & split'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[60svh] overflow-y-auto px-5 py-4">
          {step === 'overview' ? (
            <ExpenseOverviewStep
              draft={draft}
              members={members}
              onChange={(changes) => setDraft((prev) => ({ ...prev, ...changes }))}
            />
          ) : (
            <ItemizationStep
              lineItems={draft.lineItems}
              members={members}
              totalCents={totalCents}
              splitEqually={draft.splitEqually}
              onToggleSplitEqually={() =>
                setDraft((prev) => ({ ...prev, splitEqually: !prev.splitEqually }))
              }
              onToggleAssignee={toggleAssignee}
              onAddItem={() =>
                setDraft((prev) => ({ ...prev, lineItems: [...prev.lineItems, newLineItem()] }))
              }
              onUpdateItem={updateItem}
              onRemoveItem={(id) =>
                setDraft((prev) => ({
                  ...prev,
                  lineItems: prev.lineItems.filter((item) => item.id !== id),
                }))
              }
            />
          )}
          {saveError && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {saveError}
            </p>
          )}
        </div>

        <div className="flex justify-between gap-3 border-t border-gray-200 px-5 py-4">
          {step === 'overview' ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setStep('overview')}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={step === 'itemization' && (!canFinish || isSaving)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {step === 'overview' ? 'Next' : isSaving ? 'Saving…' : 'Save Expense'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
