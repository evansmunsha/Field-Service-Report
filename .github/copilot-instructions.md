# Field Service Report - AI Agent Instructions

## Project Overview

**Field Service Report** is a Next.js (App Router) web application for tracking field service time, Bible studies, and generating monthly ministry reports. It uses NextAuth.js for authentication, PostgreSQL (Neon) via Prisma for data persistence, and Tailwind CSS + shadcn/ui for the frontend.

**Key constraint**: This is a privacy-focused, open-source project with no payments/subscriptions. All features must remain free and user-centric.

## Architecture & Data Flow

### Authentication Layer (NextAuth.js)
- **Setup**: [../auth.ts](../auth.ts) contains NextAuth.js configuration with credentials provider
- **Pattern**: Every server action calls `auth()` from NextAuth.js first, then validates the user exists in the database via `getUserFromDb()`
- **Location**: [../app/actions/entries.ts](../app/actions/entries.ts) contains the auth flow template
- **Key**: Always validate users when creating data - ensures NextAuth session is linked to the local User record
- **Password Reset**: No-email flow using reset tokens displayed on screen

### Database Schema (Prisma)
- **File**: [../prisma/schema.prisma](../prisma/schema.prisma)
- **Core models**: User (with resetToken fields for password reset), TimeEntry (with date/time fields and hours calculated), Study (nested in TimeEntry)
- **Indexes**: `TimeEntry` has composite index on `[userId, date]` for fast monthly queries
- **Cascade deletes**: TimeEntry and Study cascade on User/TimeEntry deletion

### Server Actions & Data Fetching
- **Location**: [../app/actions/entries.ts](../app/actions/entries.ts) - contains all server actions for CRUD operations
- **Pattern**: Client components import these actions and invoke them directly (also uses API routes for auth endpoints)
- **Revalidation**: All mutations call `revalidatePath("/")` to clear Next.js cache and trigger re-renders
- **API Routes**: Used for authentication endpoints (forgot-password, reset-password)

### Client Components & Forms
- **Form library**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS classes; use `cn()` util for conditional classes
- **Component pattern**: [../components/time-entry-form.tsx](../components/time-entry-form.tsx) shows standard pattern - "use client", form setup with react-hook-form, submission handler calling server action
- **UI library**: [../components/ui/](../components/ui/) contains shadcn/ui primitives (Button, Card, Dialog, Calendar, etc.)

### Layout & Theming
- **Root layout**: [../app/layout.tsx](../app/layout.tsx) wraps everything in `<SessionProvider>` from NextAuth.js
- **Theme provider**: Uses system theme preference
- **Analytics**: Vercel Analytics integrated at root level

## Developer Workflows

### Local Development
```bash
pnpm dev              # Runs Next.js dev server on port 3000
```

### Database Migrations
```bash
# After schema.prisma changes:
pnpm prisma migrate dev --name <description>

# Reset database (dev only):
pnpm prisma migrate reset --force
```

### Build & Deploy
```bash
pnpm build            # Next.js build
pnpm start            # Start production server
pnpm lint             # Run ESLint
```

### Debugging Tips
- Check `.env` file for `DATABASE_URL` (must be valid PostgreSQL connection string)
- NextAuth credentials (NEXTAUTH_SECRET, NEXTAUTH_URL) in `.env` - these are required for auth to work
- If auth fails: verify NextAuth configuration in `auth.ts`
- Database connection issues: test with `DATABASE_URL_UNPOOLED` first (some tools require non-pooled connections)

## Key Patterns & Conventions

### Time Calculations
- Always calculate `hoursWorked` as `(timeEnded - timeStarted) / (1000 * 60 * 60)` (milliseconds to hours)
- Store times as ISO DateTime in database; parse on client using date-fns
- See [../components/time-entry-form.tsx](../components/time-entry-form.tsx) for example

### Error Handling in Server Actions
- Throw errors to bubble to client; use try/catch in components to display toast notifications (via `sonner`)
- Example: `setMessage({ type: "error", text: "..." })` then call `toast.error()` if using sonner
- Always set `setIsSubmitting(false)` in finally block

### Validation
- Use Zod schemas at the component level (react-hook-form) AND at the action level for security
- Time format regex: `^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$` for HH:MM validation
- [See time-entry-form.tsx for schema example](../components/time-entry-form.tsx)

### User Data Isolation
- Every query must filter by `userId` - use composite index on `[userId, date]`
- Never trust client input for user ID; always derive from NextAuth session in server actions
- Example: `prisma.timeEntry.findMany({ where: { userId: user.id, date: { ... } } })`

### Component Organization
- **Presentational**: UI components in [../components/ui/](../components/ui/) (copy-paste from shadcn/ui)
- **Business logic**: [../components/](../components/) root level (TimeEntryForm, MonthlyReport, etc.)
- **Pages**: [../app/](../app/) with App Router structure (page.tsx, layout.tsx per folder)
- **Server utilities**: [../lib/](../lib/) (db.ts singleton, utils.ts helpers)

### Password Reset Flow
- **No email required**: Tokens are displayed on screen instead of emailed
- **API endpoints**: `/api/auth/forgot-password` and `/api/auth/reset-password`
- **Frontend pages**: `/forgot-password` and `/reset-password`
- **Security**: Tokens expire in 1 hour, stored in database with expiry timestamp

## External Dependencies & Integration Points

- **Next.js 16** (App Router, server actions, streaming)
- **NextAuth.js v5** - handles identity, session tokens stored in cookies
- **Prisma 7** with PgAdapter - uses native PostgreSQL adapter for performance
- **shadcn/ui** - un-opinionated, copy-paste UI components built on Radix UI
- **React Hook Form + Zod** - form state and validation
- **date-fns** - date parsing/formatting (NOT moment.js)
- **Recharts** - charts for monthly stats visualization
- **Sonner** - toast notifications
- **Tailwind CSS 4** - utility-first styling

## File Structure Reference

```
app/                          # App Router pages & layouts
  actions/entries.ts          # Server actions for CRUD
  api/auth/                   # Authentication API routes
  page.tsx                    # Home page (entry form)
  signin/, signup/            # Auth pages
  forgot-password/            # Password reset request
  reset-password/             # Password reset form
  about/, privacy/, terms/    # Static pages
components/                   # React components
  time-entry-form.tsx         # Main form component
  monthly-report.tsx          # Report generator
  ui/                         # shadcn/ui primitives
prisma/                       # Prisma schema and migrations
lib/                          # Utilities
  db.ts                       # Prisma singleton with PgAdapter
  utils.ts                    # General helpers (cn(), formatting)
auth.ts                       # NextAuth.js configuration
```

## Common Tasks for AI Agents

### Adding a New Field to TimeEntry
1. Update [../prisma/schema.prisma](../prisma/schema.prisma) - add field with type
2. Run `pnpm prisma migrate dev --name add_field_name`
3. Update Zod schema in component
4. Update server action in [../app/actions/entries.ts](../app/actions/entries.ts) to include new field
5. Update form component to render new field

### Creating a New Server Action
- Template: [../app/actions/entries.ts](../app/actions/entries.ts) - always call `auth()` first and `getUserFromDb()` before creating/updating data
- End with `revalidatePath("/")` to invalidate cache
- Wrap in try/catch at component level

### Creating a New API Route
- Template: [../app/api/auth/forgot-password/route.ts](../app/api/auth/forgot-password/route.ts)
- Use proper HTTP methods (GET, POST, etc.)
- Always validate input data
- Return proper HTTP status codes

### Querying Monthly Data
- Filter by date range: `prisma.timeEntry.findMany({ where: { userId, date: { gte: monthStart, lt: monthEnd } } })`
- Use the `[userId, date]` index for performance
- Aggregate with JavaScript or use Prisma aggregations (`_sum`, `_count`)

## Notes for Code Quality
- **No unused variables** - TypeScript strict mode enabled
- **Null safety**: Use optional chaining (`?.`) and nullish coalescing (`??`)
- **Component granularity**: Break large components into smaller, reusable ones
- **Testing**: Currently no test suite - contributions welcome
- **Accessibility**: shadcn/ui components are WAI-ARIA compliant; test with keyboard navigation