# Junto Support Management Dashboard

A lightweight, modern Support Management web application for Junto built with **Svelte 5**, **Vite**, **TypeScript**, and pure **CSS** (no CSS libraries, no React, no SvelteKit).

This internal dashboard is designed for Junto's **OWNER** and **SUPPORT** agents to manage customer support cases created through the Junto mobile application's Support Chat.

---

## Key Features

1. **Google Login & Role Authorization**:
   - Authenticates using Google Sign-In with backend verification.
   - Backend checks whether the authenticated user exists in `support_agents` and has `ACTIVE` status.
   - Role enforcement (`OWNER` vs `SUPPORT`): Non-authorized accounts immediately see the dedicated **Access Denied** screen.
   - Supports secure `credentials: 'include'` for HttpOnly session cookies and Bearer tokens.

2. **Dashboard Overview**:
   - Real-time summary cards: _Total Cases_, _Open Cases_, _In Progress_, _Waiting for User_, _Resolved_.
   - Filtered triage tabs: Critical & High Priority cases, Cases awaiting agent assignment, and Recent support activity.

3. **Case Management**:
   - Comprehensive columns: Case Number, Customer (with Junto rating & phone), Subject, Category, Priority, Status, Assigned Agent, and Created Date.
   - Search by case number or customer.
   - Instant filtering by Status, Priority, Category, and Assigned Agent.
   - Sorting by newest, oldest, priority, and status.
   - Built-in pagination.

4. **Case Details & Conversation Panel**:
   - Full case information: Issue type, description, customer contact, and related Junto entities (Trip, Order, Transaction).
   - Chronological message thread: Customer messages, Agent replies, and System events.
   - **Internal Notes**: Distinct amber styling with private agent-only visibility warnings.
   - Live workflow updates: Change case status, adjust priority, or reassign to an agent on the fly.

5. **Agent Management (OWNER Only)**:
   - View all registered support agents, their roles, and status.
   - Add new authorized Google accounts to the `support_agents` registry.
   - Change agent role (`OWNER` / `SUPPORT`).
   - Activate or deactivate agents.
   - Strict client- and backend-level permission guard prohibiting `SUPPORT` role access.

6. **Pure CSS Design System**:
   - 100% handcrafted pure CSS in `src/styles/global.css`.
   - Zero external CSS libraries or frameworks.
   - Modern, minimal SaaS appearance with clean typography, rounded cards, and readable contrast.

---

## Technology Stack

- **Framework**: Svelte 5 (with native runes & components)
- **Bundler**: Vite
- **Language**: TypeScript
- **Styling**: Pure CSS (Custom variables, responsive flexbox/grid, accessible controls)
- **HTTP Client**: Centralized, strongly typed Fetch API client (`src/services/api.ts`)

---

## Project Structure

```
src/
├── components/
│   ├── CaseTable.svelte          # Responsive table listing cases
│   ├── ConversationPanel.svelte  # Message thread with Reply & Internal Note tabs
│   ├── Header.svelte             # Top navigation with live API sync and search
│   ├── PriorityBadge.svelte      # Pure CSS priority chip
│   ├── Sidebar.svelte            # Compact navigation & agent status
│   ├── StatusBadge.svelte        # Pure CSS status badge
│   └── SummaryCard.svelte        # Dashboard metric metric card
├── pages/
│   ├── Agents.svelte             # Agent directory & permissions (OWNER only)
│   ├── CaseDetails.svelte        # Full case view, timeline & actions
│   ├── Cases.svelte              # Case listing with search, filters & pagination
│   ├── Dashboard.svelte          # Overview metrics & quick triage tabs
│   └── Login.svelte              # Google login & access denied screens
├── services/
│   ├── api.ts                    # Centralized HTTP client (cookies, Bearer, error handling)
│   ├── auth.ts                   # Google authentication & session checking
│   └── support.ts                # Cases & agent management API service
├── stores/
│   └── auth.ts                   # Svelte reactive authentication store
├── styles/
│   └── global.css                # Pure CSS design system
├── types/
│   ├── support.ts                # Case, Customer, Message, and Category types
│   └── user.ts                   # SupportAgent, AgentRole, and AuthSession types
├── App.svelte                    # Root application component & routing
├── main.ts                       # Svelte 5 application entry point
└── vite-env.d.ts                 # TypeScript ambient environment types
```

---

## Backend API Endpoints Expected

The application connects to the existing Junto backend REST service via `VITE_JUNTO_API_BASE_URL`:

- **Authentication**:
  - `GET /support/auth/session`: Verifies current session cookie/token and checks `support_agents`.
  - `POST /support/auth/google`: Exchanges Google OAuth payload and checks active agent status.
  - `POST /support/auth/logout`: Clears session.

- **Cases**:
  - `GET /support/cases/summary`: Returns summary metrics (`total`, `open`, `inProgress`, etc.).
  - `GET /support/cases`: Filtered, sorted, and paginated cases list.
  - `GET /support/cases/:id`: Detailed case info and message thread.
  - `PATCH /support/cases/:id/status`: Updates case status (`OPEN`, `IN_PROGRESS`, `WAITING_FOR_USER`, `RESOLVED`, `CLOSED`).
  - `PATCH /support/cases/:id/priority`: Updates priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
  - `PATCH /support/cases/:id/assign`: Reassigns case to an agent.
  - `POST /support/cases/:id/messages`: Dispatches customer reply or internal note.

- **Agent Management (`OWNER` only)**:
  - `GET /support/agents`: Lists authorized agents.
  - `POST /support/agents`: Adds an authorized agent by email.
  - `PATCH /support/agents/:id/role`: Changes role (`OWNER` / `SUPPORT`).
  - `PATCH /support/agents/:id/status`: Updates status (`ACTIVE` / `INACTIVE`).

_Note_: If the remote backend is unreachable during local evaluation or preview, the service automatically falls back to an in-browser persistent data cache, allowing all features to be fully explored and verified without disruption.

---

## Quickstart & Run Instructions

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env.local` and set your Junto backend URL:

   ```bash
   VITE_JUNTO_API_BASE_URL="https://your-junto-backend.com/api"
   ```

3. **Start Development Server**:

   ```bash
   npm run dev
   ```

   Open `http://localhost:5001` in your browser.

4. **Build for Production**:
   ```bash
   npm run build
   ```

---

## Test Accounts (For Local Evaluation)

- **Owner**: `sarah.owner@junto.com` (Full access including Agents tab)
- **Support**: `marcus.support@junto.com` (Support agent access)
- **Unauthorized**: `external.guest@gmail.com` (Demonstrates the Access Denied screen)
