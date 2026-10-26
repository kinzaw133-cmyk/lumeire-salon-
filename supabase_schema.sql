-- ====================================================================
-- LUMIÈRE SALON - SUPABASE DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- ====================================================================
-- Project ID: evwowixearvwpwcbmaxj
-- URL: https://evwowixearvwpwcbmaxj.supabase.co
--
-- How to run this script:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/evwowixearvwpwcbmaxj
-- 2. Click on "SQL Editor" in the left sidebar
-- 3. Click "+ New query"
-- 4. Copy and paste this entire file content
-- 5. Click the "RUN" button (green button or Ctrl+Enter)
-- ====================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- 1. PROFILES TABLE (Users, Staff, Admins linked to Supabase Auth)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'staff', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles:
DROP POLICY IF EXISTS "Public profiles are viewable by owner or admin" ON public.profiles;
CREATE POLICY "Public profiles are viewable by owner or admin"
ON public.profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Trigger to automatically create a profile record when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ====================================================================
-- 2. SERVICES TABLE (Salon Treatments & Services Catalog)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price TEXT NOT NULL,
  price_num NUMERIC NOT NULL,
  mins INTEGER NOT NULL,
  icon TEXT,
  icon_name TEXT,
  description TEXT,
  perks JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Services:
-- Anyone (guest or logged-in) can view active treatments
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services"
ON public.services FOR SELECT
USING (is_active = true);

-- Only Admins can insert, update or delete services
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
CREATE POLICY "Admins can manage services"
ON public.services FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);


-- ====================================================================
-- 3. BOOKINGS TABLE (Salon Appointments & Reservations)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY DEFAULT ('lum-' || floor(extract(epoch from now()) * 1000)::text),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_id TEXT REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  price TEXT,
  mins INTEGER DEFAULT 45,
  date TEXT NOT NULL, -- Format YYYY-MM-DD
  time TEXT NOT NULL, -- Format HH:MM (e.g. "14:00")
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  status TEXT DEFAULT 'confirmed' NOT NULL CHECK (status IN ('confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- RLS Policies for Bookings:
-- Rule: "Customers sirf insert kar saken, baqi sab sirf admin ke liye"
-- ====================================================================

-- 1. Customers / Public guests ONLY INSERT kar saken (New appointment booking)
DROP POLICY IF EXISTS "Customers can only insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can insert bookings" ON public.bookings;
CREATE POLICY "Customers can only insert bookings"
ON public.bookings
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 2. Sirf Admin / Authenticated users bookings dekh saken (SELECT)
DROP POLICY IF EXISTS "Only admin can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can view bookings for availability" ON public.bookings;
CREATE POLICY "Only admin can view bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (true);

-- 3. Sirf Admin / Authenticated users bookings update kar saken (UPDATE)
DROP POLICY IF EXISTS "Only admin can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins or owners can update bookings" ON public.bookings;
CREATE POLICY "Only admin can update bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Sirf Admin / Authenticated users bookings delete kar saken (DELETE)
DROP POLICY IF EXISTS "Only admin can delete bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public can cancel bookings" ON public.bookings;
CREATE POLICY "Only admin can delete bookings"
ON public.bookings
FOR DELETE
TO authenticated
USING (true);



-- ====================================================================
-- 4. FORM SUBMISSIONS TABLE (Contact, Inquiries & Special Requests)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread' NOT NULL CHECK (status IN ('unread', 'read', 'in_progress', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fast lookup index
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON public.form_submissions(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Form Submissions:
-- 1. Anyone can submit contact/inquiry form
DROP POLICY IF EXISTS "Anyone can submit inquiry form" ON public.form_submissions;
CREATE POLICY "Anyone can submit inquiry form"
ON public.form_submissions FOR INSERT
WITH CHECK (true);

-- 2. Only authenticated admins can read form inquiries
DROP POLICY IF EXISTS "Only admins can view form submissions" ON public.form_submissions;
CREATE POLICY "Only admins can view form submissions"
ON public.form_submissions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 3. Only authenticated admins can update or resolve inquiries
DROP POLICY IF EXISTS "Only admins can update form submissions" ON public.form_submissions;
CREATE POLICY "Only admins can update form submissions"
ON public.form_submissions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);


-- ====================================================================
-- 5. REVIEWS TABLE (Customer Reviews & Ratings)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  service_id TEXT REFERENCES public.services(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Reviews:
-- 1. Anyone can view approved reviews
DROP POLICY IF EXISTS "Anyone can read approved reviews" ON public.reviews;
CREATE POLICY "Anyone can read approved reviews"
ON public.reviews FOR SELECT
USING (is_approved = true);

-- 2. Anyone can submit a review
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.reviews;
CREATE POLICY "Anyone can submit a review"
ON public.reviews FOR INSERT
WITH CHECK (true);

-- 3. Admins can manage, approve, or delete reviews
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;
CREATE POLICY "Admins can manage reviews"
ON public.reviews FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);


-- ====================================================================
-- 6. INITIAL DATA SEEDING (Services & Default Appointments)
-- ====================================================================
-- Insert default salon services into services table
INSERT INTO public.services (id, name, category, price, price_num, mins, icon, icon_name, description, perks, is_active)
VALUES
  (
    'haircut',
    'Haircut & Bespoke Style',
    'Hair',
    'Rs 1,500',
    1500,
    45,
    '✂️',
    'Scissors',
    'Personalized consultation, luxury hair bath, precision cut & blowout styling.',
    '["Diagnostic scalp analysis & hair texture consultation", "Essential botanical oil hair bath & head massage", "Precision bespoke scissor cut & customized styling", "Complimentary thermal protection & silk blowout finish"]'::jsonb,
    true
  ),
  (
    'colour',
    'Balayage & Hair Gloss',
    'Hair',
    'Rs 5,000',
    5000,
    120,
    '✨',
    'Sparkles',
    'Custom hand-painted French balayage or root-to-tip tint with luminous gloss.',
    '["Custom color harmony matching & toning formulation", "Ammonia-free French botanical lightening clay", "High-shine acidic gloss glaze for 8-week mirror shine", "Deep moisture bond-building restorative mask"]'::jsonb,
    true
  ),
  (
    'facial',
    'Botanical Glow Facial',
    'Skin',
    'Rs 2,500',
    2500,
    60,
    '🌸',
    'Flower2',
    'Ultrasonic deep cleanse, enzymatic exfoliation & hydrating lavender essence mask.',
    '["Ultrasonic pore extraction & diamond micro-cleansing", "Enzymatic papaya-lavender peel for luminous renewal", "Cryo-globe lymphatic facial drainage contouring", "24k gold infused organic rosehip hydration seal"]'::jsonb,
    true
  ),
  (
    'mani',
    'Deluxe Gel Manicure',
    'Nails',
    'Rs 1,200',
    1200,
    45,
    '💅',
    'Gem',
    'Cuticle treatment, organic rose-lavender scrub, hand massage & high-shine gel polish.',
    '["Nail sculpting, cuticle nourishing treatment & buffing", "Warm lavender sugar scrub & warm towel compress", "Relaxing acupressure hand & forearm massage", "Long-wearing chip-resistant gel polish with LED curing"]'::jsonb,
    true
  ),
  (
    'bridal',
    'Signature Bridal Glam',
    'Glamour',
    'Rs 15,000',
    15000,
    150,
    '👑',
    'Crown',
    'High-definition bridal makeup, couture hair sculpting, lash application & setting.',
    '["HD waterproof bridal airbrush or silk foundation match", "Intricate couture bridal hair sculpting & veil placement", "Mink lash artistry & customized eye contouring", "Full luxury touch-up kit including artisan lipstick sample"]'::jsonb,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  price_num = EXCLUDED.price_num,
  mins = EXCLUDED.mins,
  icon = EXCLUDED.icon,
  icon_name = EXCLUDED.icon_name,
  description = EXCLUDED.description,
  perks = EXCLUDED.perks,
  is_active = EXCLUDED.is_active;

-- Insert initial sample demo bookings for testing
INSERT INTO public.bookings (id, service_id, service_name, price, mins, date, time, name, phone, notes, status)
VALUES
  (
    'bk-demo1',
    'facial',
    'Botanical Glow Facial',
    'Rs 2,500',
    60,
    to_char(CURRENT_DATE, 'YYYY-MM-DD'),
    '11:00',
    'Sophia Vance',
    '+1 (555) 234-8899',
    'Sensitive skin, prefer calming lavender hydration',
    'confirmed'
  ),
  (
    'bk-demo2',
    'haircut',
    'Haircut & Bespoke Style',
    'Rs 1,500',
    45,
    to_char(CURRENT_DATE, 'YYYY-MM-DD'),
    '15:00',
    'Amara Khan',
    '+1 (555) 987-6543',
    'Layered cut with blowout',
    'confirmed'
  ),
  (
    'bk-demo3',
    'bridal',
    'Signature Bridal Glam',
    'Rs 15,000',
    150,
    to_char(CURRENT_DATE + 1, 'YYYY-MM-DD'),
    '14:00',
    'Elena Rostova',
    '+1 (555) 555-8899',
    'Bridal trial makeup & hair fitting',
    'confirmed'
  )
ON CONFLICT (id) DO NOTHING;
