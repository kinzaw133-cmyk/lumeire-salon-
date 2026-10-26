# Salon Booking Website (Next.js + Supabase)

Lumière Salon booking web application with real-time appointment scheduling, Owner Portal, and Supabase database cloud sync.

## Quick Start
1. `npm install`
2. `npm run dev`, then open http://localhost:3000
3. Owner / Stylist Management Portal: http://localhost:3000/admin

## Supabase Database Setup
1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/evwowixearvwpwcbmaxj
2. Navigate to the **SQL Editor** tab.
3. Open [`supabase_schema.sql`](./supabase_schema.sql), copy its entire content, paste it into the SQL Editor, and click **RUN**.
4. The following tables will be created with Row Level Security (RLS) and initial seed data:
   - `profiles` (Auth users, staff, and admin accounts)
   - `services` (Salon treatments catalog with pricing & perks)
   - `bookings` (Client reservations with date, time, status)
   - `form_submissions` (Contact inquiries & VIP consultation requests)
   - `reviews` (Customer ratings & testimonials)

Environment variables are configured in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

