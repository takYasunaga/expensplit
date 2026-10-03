import { useState } from 'react'
import { ExpenseList } from './components/ExpenseList'
import { Header } from './components/Header'
import { MemberList } from './components/MemberList'
import { Tabs, type TabOption } from './components/Tabs'
import { mockExpenses, mockGroup } from './mockData'

type TabId = 'expenses' | 'members'

const TABS: TabOption<TabId>[] = [
  { id: 'expenses', label: 'Expenses / Receipts' },
  { id: 'members', label: 'Members' },
]

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('expenses')

  return (
    <div className="min-h-svh bg-gray-50 text-gray-900">
      <Header group={mockGroup} />
      <main className="mx-auto max-w-2xl px-4 py-4">
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        <section
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className="pt-4"
        >
          {activeTab === 'expenses' ? (
            <ExpenseList expenses={mockExpenses} members={mockGroup.members} />
          ) : (
            <MemberList members={mockGroup.members} />
          )}
        </section>
      </main>
    </div>
  )
}

export default App
