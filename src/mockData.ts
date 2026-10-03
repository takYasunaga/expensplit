import type { Expense, Group, User } from './types'

export const mockUsers: User[] = [
  { id: 'user-bob', displayName: 'Bob' },
  { id: 'user-amy', displayName: 'Amy' },
  { id: 'user-tony', displayName: 'Tony' },
  { id: 'user-sarah', displayName: 'Sarah' },
]

const everyone = mockUsers.map((user) => user.id)

export const mockGroup: Group = {
  id: 'group-tokyo-2026',
  name: 'Tokyo Trip 2026',
  inviteCode: 'TOKYO-2026-X7K9',
  members: mockUsers,
}

export const mockExpenses: Expense[] = [
  {
    // Izakaya dinner, paid by Bob
    id: 'expense-izakaya',
    groupId: mockGroup.id,
    title: 'Izakaya Torikizoku',
    payerId: 'user-bob',
    totalAmount: 12400,
    lineItems: [
      {
        id: 'item-yakitori',
        description: 'Yakitori platter',
        amount: 3600,
        assignedTo: everyone,
      },
      {
        id: 'item-ramen',
        description: 'Tonkotsu ramen',
        amount: 1800,
        assignedTo: ['user-amy'],
      },
      {
        id: 'item-sashimi',
        description: 'Sashimi set',
        amount: 3200,
        assignedTo: ['user-tony', 'user-sarah'],
      },
      {
        id: 'item-drinks',
        description: 'Draft beer x3',
        amount: 2800,
        assignedTo: ['user-bob', 'user-amy', 'user-tony'],
      },
      {
        id: 'item-service',
        description: 'Service charge',
        amount: 1000,
        assignedTo: everyone,
      },
    ],
    createdTimestamp: '2026-04-12T20:45:00+09:00',
  },
  {
    // Transit and station shop run, paid by Amy
    id: 'expense-transit',
    groupId: mockGroup.id,
    title: 'Shinjuku Station',
    payerId: 'user-amy',
    totalAmount: 8600,
    lineItems: [
      {
        id: 'item-day-pass',
        description: 'Subway day pass x4',
        amount: 6000,
        assignedTo: everyone,
      },
      {
        id: 'item-snacks',
        description: 'Train snacks',
        amount: 1400,
        assignedTo: ['user-bob', 'user-sarah'],
      },
      {
        id: 'item-umbrella',
        description: 'Umbrella',
        amount: 1200,
        assignedTo: ['user-tony'],
      },
    ],
    createdTimestamp: '2026-04-13T09:10:00+09:00',
  },
]
