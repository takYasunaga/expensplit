import { useEffect, useState } from 'react'
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
          Showing sample data — Supabase is not connected.
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
            <ExpenseList key={group.id} groupId={group.id} members={group.members} />
          ) : (
            <MemberList members={group.members} />
          )}
        </section>
      </main>
    </div>
  )
}

export default App
