# Product Requirements Document (PRD)
# 1. Executive Summary
- App Name: Group Expense & Receipt Splitter
- Target Audience: Groups on trips, roommates, or friends on outings.
- Core Problem: Manual expense splitting after group trips is tedious, error-prone, and slow.
- Solution: A group-based expense tracker that uses OCR/AI to scan receipts, split line items by individual, and compute optimal balances to square up.

# 2. Core Concepts & Data Models
## 2.1 Group
- id: Unique identifier
- name: Name of the trip/group
- inviteCode: Unique string/link for joining
- members: List of User profiles in the group

## 2.2 Payment Object (Expense)
- id: Unique identifier
- groupId: Associated group
- payerId: ID of the member who paid upfront
- totalAmount: Total cost of the receipt
- receiptImage: Optional uploaded receipt image
- lineItems: List of items parsed from receipt
    - description: Name of the item/charge
    - amount: Price of the item (including tax/tip split)
    - assignedTo: List of member IDs responsible for this item
- createdTimestamp: Date/time of entry

## 2.3 Settlement (Square Up)
- Calculated Balance: Aggregate total net balance for each member in a group.
- Optimal Settlement: Algorithmically simplified "Who Owes Who" transfers to minimize total payments.

# 3. Primary Feature Specifications
- Feature A: Group Management
    - User can create a new group (e.g., "Tokyo Trip 2026").
    - User can share an invite link/code.
    - Joining members enter a display name to enter the group workspace.

- Feature B: Receipt Scanning & Itemization (Primary Function)
    - Input Method: User uploads/photos a receipt OR enters total manually.
    - OCR Parsing: AI parses raw image into line items with descriptions and costs.
    - Assignment Flow:
        - Step 1: Select Who Paid (defaults to creator).
        - Step 2: Assign individual line items to specific group members.
        - Step 3: Handle shared items (if 2 people split an app, divide cost proportionally).
        - Step 4: Confirm and post payment object to group ledger.

- Feature C: Balance Calculation & Settlement (Secondary Function)
    - Ledger View: Displays net owed/due amounts for each participant.
    - "Square Up" Generator: Converts net debts into direct peer-to-peer instructions (e.g., "Amy owes Bob $18.50" instead of multiple back-and-forth transfers).
    - Mark as Paid: Member marks a debt as settled once paid externally (e.g., via Interac / Venmo).

# 4. Technical Stack Guidance
- Frontend: React with Tailwind CSS (or React Native for mobile)
- Backend / Database: Supabase or Firebase (handles real-time database, group state, and user authentication)
- OCR / AI Parsing: OpenAI Vision API / Claude API (accepts receipt image, returns structured JSON line items)

# 5. Development Roadmap for Claude Code
- Phase 1: Foundation & Data Structure
    [ ] Initialize project with React, Tailwind CSS, and simple local state / Supabase setup.
    [ ] Create mock data for Users, Groups, and Expense Objects.
    [ ] Build basic UI layout with Group view and Member list.

- Phase 2: Manual Expense Creation & Ledger
    [ ] Build UI to manually add expenses with payer and item breakdown.
    [ ] Create balance summary view showing total spent and individual balances.

- Phase 3: Square Up Algorithm
    [ ] Implement balance reduction logic to calculate the minimum number of payments required to settle all debts.
    [ ] Build UI for "Square Up" settlement overview with "Mark as Paid" action.

- Phase 4: OCR / AI Receipt Integration
    [ ] Add image upload component.
    [ ] Connect Claude/OpenAI API endpoint to convert receipt images to structured line-item JSON.
    [ ] Pre-populate itemization form with AI results for user review before saving.