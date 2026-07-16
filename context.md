# PROJECT CONTEXT: "WaktuJaga" - Hackathon MVP (18 Hours Limit)

## 1. Project Overview
You are building an MVP for a B2B2C micro-insurance platform called "WaktuJaga". The platform allows low-income communities to earn "Emergency Credit" by performing social tasks (time-banking). This credit is funded by Corporate CSR (Corporate Social Responsibility) sponsorships. 
The goal is to build a functional Proof of Concept (PoC) demonstrating the core transaction loop within an 18-hour hackathon timeframe.

## 2. Tech Stack Requirements
*   **Core Framework:** Next.js (App Router) running on a Node.js environment.
*   **Language:** Strict TypeScript (Full-Stack).
*   **Styling:** Tailwind CSS + shadcn/ui (use pre-built components for speed).
*   **Database & Auth:** Supabase (PostgreSQL). Use Supabase generated TypeScript types.
*   **External Integration:** Design API endpoints (Next.js Route Handlers) to accept webhooks from external workflow automation platforms (Make.com / n8n) which will handle off-app processing (like OCR/image verification).

## 3. Architecture: Single App, Role-Based Access
Do not build separate apps. Build a single Next.js application with two distinct layouts based on user roles. Ignore complex JWT/OAuth for this MVP; use a simple mocked login state or Supabase basic auth.

*   **Role 1: Warga (B2C / Community Member)**
    *   Mobile-first UI.
    *   Route: `/dashboard/warga`
    *   Features: 
        1. View current "Credit Balance" (Saldo).
        2. Form to submit a new task (Select task type, input hours, upload photo URL).
*   **Role 2: Corporate Sponsor (B2B)**
    *   Desktop-first UI.
    *   Route: `/dashboard/corporate`
    *   Features: 
        1. KPI Dashboard showing total CSR funds remaining and total community hours generated.
        2. Data table showing a log of recent tasks completed by the community.

## 4. Minimum Database Schema (Supabase)
Create types for these tables:

1.  `users`
    *   `id` (uuid, PK)
    *   `role` (enum: 'warga', 'corporate')
    *   `name` (string)
    *   `balance` (numeric, default 0) - for warga
2.  `tasks`
    *   `id` (uuid, PK)
    *   `warga_id` (uuid, FK to users)
    *   `task_type` (string)
    *   `hours_spent` (numeric)
    *   `photo_url` (string)
    *   `status` (enum: 'pending', 'approved', 'rejected')
    *   `credit_earned` (numeric)
3.  `corporate_funds`
    *   `id` (uuid, PK)
    *   `sponsor_name` (string)
    *   `total_budget` (numeric)
    *   `funds_disbursed` (numeric)

## 5. The "Golden Flow" to Implement
1. Warga visits `/dashboard/warga` and submits a task form.
2. The form data is saved to the `tasks` table with status 'pending'.
3. **Simulated Automation:** Instead of waiting for real external webhooks, create a Next.js Server Action or API Route (`/api/trigger-automation`) that acts as a mock Make.com/n8n agent. When triggered, it automatically changes the task status to 'approved', calculates `credit_earned` (hours * 25000), adds it to the user's `balance`, and updates `funds_disbursed` in `corporate_funds`.
4. Corporate user visits `/dashboard/corporate` and sees the updated metrics dynamically.

## 6. Coding Rules for the Agent
*   **Prioritize Speed & Visuals:** We need a working demo. Mock complex business logic if it takes too long.
*   **TypeScript:** Use strict typing for all Supabase queries and React component props.
*   **Components:** Break down UI into modular server and client components. Keep the 'use client' directives only where necessary (forms, buttons).
*   **Error Handling:** Implement basic try-catch blocks for database operations and return user-friendly toast notifications.

Please acknowledge this context. Let me know when you are ready, and I will tell you which component to build first.