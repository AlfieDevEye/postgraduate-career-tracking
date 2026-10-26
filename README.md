This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Employment reminder scheduling

The admin reminder tools use existing Supabase Auth email/password sign-in. Add the administrator's auth email to `public.admin_users` with `role` set to `admin` or `super_admin` and `is_active = true`. Every admin API request validates the bearer token and checks that row server-side.

Set these server environment variables in local `.env.local` and in the deployment environment:

- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service-role secret. It is used only by server routes and must never use the `NEXT_PUBLIC_` prefix.
- `TRACKING_CRON_SECRET`: a long random value sent as `Authorization: Bearer <value>` by the scheduled job.
- `RESEND_API_KEY` and `RESEND_FROM_EMAIL`: optional until email delivery is configured. Resend must verify the sender domain/address. Without both values, simulation still works and send mode reports `not_sent`.

Apply migrations with `supabase db push` (or run the SQL in the Supabase SQL editor) before using `/admin/reminders`. Sign in at `/admin/login`. Save a 3, 6, or 9 month interval there; existing active records' `next_update_date` values are recalculated from `last_update_date` or `tracking_start_date`. Tracking ends default to five years where no end date exists. The migration adds an isolated `tracking_test_runs` audit table, validates/seeds tracking settings, fills missing schedule dates, and installs a trigger to calculate dates for new tracking rows or updated response dates.

Use **Simulate now** to evaluate one selected record immediately without changing its production tracking dates or sending email. Use **Send test email now** to send only to that selected student's address once Resend is configured. Repeated test sends for the same record and interval are blocked for the rest of that day.

Configure a deployment cron to POST `/api/cron/tracking-reminders` at the desired cadence (for example, daily) with the `TRACKING_CRON_SECRET` bearer header. It processes due active records, skips inactive/expired records and duplicates already logged for the current due date, and records successful sends in `tracking_communications`. If Resend is not configured, the route reports per-record delivery failures and leaves reminders eligible for a later run.
