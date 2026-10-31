# Junto Support Management Dashboard (React)

A lightweight, modern Support Management web application for Junto rewritten in **React 19**, **TypeScript**, **Vite**, and pure **CSS** stylesheet.

This internal dashboard is designed for Junto's **OWNER** and **SUPPORT** agents to manage customer support cases created through the Junto mobile application's Support Chat.

---

## 1. Features

- **Real-Time Google Authentication**:
  - Direct integration with Google Identity Services using official Google Sign-In and One Tap.
  - Configurable with client ID `VITE_GOOGLE_CLIENT_ID` in `.env`.
  - Parses real Google JWT ID token (user email, name, avatar picture).
  - Manual JWT / ID token verification fallback.
- **Operations Dashboard**:
  - Key metrics overview (Total, Open, In Progress, Waiting for User, Resolved).
  - Triage focus tabs: Critical & High Priority, Awaiting Assignment queue, Recent Cases.
- **Case Management & Triage**:
  - Filter by view: All Cases, My Cases, Unassigned Queue, Resolved Archive.
  - Full-text search across Case #, Customer Name, and Email.
  - Multi-parameter filtering by Status, Priority, Category, and Assigned Agent.
  - Sorting (Newest, Oldest, Priority, Status) and pagination controls.
- **Case Details & Customer Context**:
  - Live status, priority, and assignee dropdowns.
  - Customer information card with rating, email, phone, and Junto membership tenure.
  - Related Junto entity display (Trips, Bookings, Tickets, Deals) with total amounts and dates.
- **Conversation Thread**:
  - Chronological message history showing customer queries, agent answers, and system events.
  - Multi-tab composer for replying directly to customer or writing private internal agent notes.
- **Access Control & Agent Directory (Owner Only)**:
  - Role-based authorization (`OWNER` vs `SUPPORT`).
  - Add authorized support agent modal with Google email mapping.
  - Agent role modification and status activation/deactivation toggles.

---

## 2. Environment Configuration

To configure environment variables, edit `.env`:

```bash
# Google OAuth 2.0 Web Client ID
VITE_GOOGLE_CLIENT_ID=310875006924-5dsprg0oqeivq38pam5glqeb9hkslf9k.apps.googleusercontent.com

# Backend API URL (defaults to /api)
VITE_API_BASE_URL=
VITE_JUNTO_API_BASE_URL=
```

---

## 3. Scripts

- `npm run dev`: Starts the Vite development server on port 3000.
- `npm run build`: Compiles the React TypeScript application for production.
- `npm run lint`: Validates TypeScript types across all files.
