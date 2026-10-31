# Junto Support Management Dashboard

A lightweight, modern Support Management web application for Junto rewritten with **React 19**, **Vite**, **TypeScript**, and pure **CSS** (no CSS bloat, clean minimal SaaS design system).

This internal dashboard is designed for Junto's **OWNER** and **SUPPORT** agents to manage customer support cases created through the Junto mobile application's Support Chat.

---

## 1. REST API Contract & Integration

The dashboard connects to the existing Junto backend REST services at base path `/api/support` (configurable via `VITE_API_BASE_URL`):

### Authentication & Agent Authorization

- **`GET /api/auth/me`**:
  Retrieves the authenticated agent identity (`id`, `userId`, `name`, `email`, `role`, `isActive`).
  Enforces role validation: Non-support users (e.g. `role: USER`) or inactive agents immediately receive the **Access Denied** screen.
  Returns **HTTP 401** if session expired or unauthenticated.
- **`POST /api/auth/google`**:
  Google OAuth token exchange with active agent validation. Body strictly conforms to `GoogleWebLoginSchema`:
  `{ "idToken": string, "platform": "WEB", "deviceInfo": { "platform": "WEB", "userAgent": string } }`
- **`POST /api/auth/logout`**:
  Clears session and auth cookies.

### Dashboard Operations

- **`GET /api/support/dashboard/summary`**:
  Fetches live metrics: `totalCases`, `openCases`, `assignedCases`, `inProgressCases`, `waitingForUserCases`, `resolvedCases`, `unassignedCases`, `criticalCases`, `highPriorityCases`.
- **`GET /api/support/dashboard/recent-cases?limit=10`**:
  Fetches recent customer support cases for immediate triage.

### Case Management

- **`GET /api/support/cases`**:
  Filtered, sorted, and paginated cases list with query parameters:
  - `page` (1-indexed)
  - `limit` (page size)
  - `status` (`OPEN`, `ASSIGNED`, `IN_PROGRESS`, `WAITING_FOR_USER`, `RESOLVED`, `CLOSED`)
  - `priority` (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`)
  - `category` (`RIDES`, `DAYMATES`, `SERVICES`, `TICKETS`, `DEALS`, `HELPME`, `SAFETY`, `PAYMENT`, `ACCOUNT`, `GENERAL`)
  - `assignedTo` (Agent UUID or `unassigned`)
  - `search` (Matches case number, customer name, email, or subject)
- **`GET /api/support/cases/:caseId`**:
  Detailed case record including customer info, description, related Junto entity (Ride, Activity, Ticket, Service), and status.
- **`PATCH /api/support/cases/:caseId/assign`**:
  Body: `{ "agentId": "agent-uuid" | null }`. Assigns or unassigns case.
- **`PATCH /api/support/cases/:caseId/status`**:
  Body: `{ "status": "IN_PROGRESS" }`. Updates case status.
- **`PATCH /api/support/cases/:caseId/priority`**:
  Body: `{ "priority": "CRITICAL" }`. Updates priority.

### Case Conversation Thread

- **`GET /api/support/cases/:caseId/messages`**:
  Fetches chronological case conversation. Internal notes are only visible to authorized agents.
- **`POST /api/support/cases/:caseId/messages`**:
  - Customer-visible reply: `{ "message": "...", "isInternalNote": false }`
  - Internal agent note: `{ "message": "...", "isInternalNote": true }`

### Support Agent Management (OWNER Only)

- **`GET /api/support/agents`**:
  Lists all authorized agents. Prohibited for `SUPPORT` role.
- **`POST /api/support/agents`**:
  Body: `{ "userId": "user-uuid", "role": "SUPPORT" }` (or `{ email, name, role }`). Authorizes a user as an agent.
- **`PATCH /api/support/agents/:agentId`**:
  Body: `{ "role": "OWNER" | "SUPPORT", "isActive": boolean }`. Updates role or activates/deactivates agent.

---

## 2. Backend Interoperability & Normalization

The frontend service (`src/services/support.ts` & `src/services/api.ts`) is designed to handle both:

1. The **Support Management Contract** (`{ success: true, data: ..., pagination: ... }`)
2. The **Mobile App Router Responses** (`{ success: true, cases: [...] }`, `{ success: true, case: ... }`, `{ success: true, messages: [...] }`)

If any endpoint is offline or returns an unexpected error during local development, the service gracefully surfaces clear diagnostics while preserving interactive testing through the persistent in-browser cache.

---

## 3. Quickstart & Run Instructions

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env.local` and set your backend API URL:

   ```bash
   VITE_API_BASE_URL="http://localhost:3000/api"
   ```

3. **Start Development Server**:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000` in your browser.

4. **Build for Production**:

   ```bash
   npm run build
   ```

5. **Typecheck & Lint**:
   ```bash
   npm run lint
   ```

---

## 4. Test Accounts (For Local Evaluation)

- **Owner**: `sarah.owner@junto.com` (Full access including Agent Directory)
- **Support**: `marcus.support@junto.com` (Case management access; Agent Directory restricted)
- **Unauthorized**: `external.guest@gmail.com` (Triggers HTTP 403 Access Denied screen)
