import { useEffect, useState } from 'react'
import { AddExpenseModal } from './components/AddExpenseModal'
import { ExpenseList } from './components/ExpenseList'
import { Header } from './components/Header'
import { MemberList } from './components/MemberList'
import { Tabs, type TabOption } from './components/Tabs'
import { fetchGroup, isMockGroup } from './services/expenseService'
import type { Group } from './types'

type TabId = 'expenses' | 'members'

const TABS: TabOption<TabId>[] = [
  { id: 'expenses', label: 'Expenses / Receipts' },
  { id: 'members', label: 'Members' },
]

function App() {
  const [group, setGroup] = useState<Group | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('expenses')
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [expensesVersion, setExpensesVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchGroup().then((loaded) => {
      if (!cancelled) setGroup(loaded)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!group) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-gray-50 text-sm text-gray-500">
        Loading group…
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-gray-50 text-gray-900">
      {isMockGroup(group) && (
        <p className="bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-900">
          Showing sample data — Supabase is not connected, so new expenses are lost on reload.
        </p>
      )}
      <Header group={group} />
      <main className="mx-auto max-w-2xl px-4 py-4">
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        <section
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className="pt-4"
        >
          {activeTab === 'expenses' ? (
            <>
              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(true)}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  + Add Expense
                </button>
              </div>
              <ExpenseList
                key={group.id}
                groupId={group.id}
                members={group.members}
                refreshKey={expensesVersion}
              />
            </>
          ) : (
            <MemberList members={group.members} />
          )}
        </section>
      </main>
      {isAddExpenseOpen && group.members.length > 0 && (
        // No sign-in yet, so the first member stands in for the current user.
        <AddExpenseModal
          groupId={group.id}
          members={group.members}
          currentUserId={group.members[0].id}
          onClose={() => setIsAddExpenseOpen(false)}
          onSaved={() => setExpensesVersion((version) => version + 1)}
        />
      )}
    </div>
  )
}

export default App
