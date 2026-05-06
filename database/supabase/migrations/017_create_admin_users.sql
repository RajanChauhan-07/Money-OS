-- 017: Admin users — ops team, separate from regular users
CREATE TABLE public.admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'readonly'
    CHECK (role IN ('super_admin','ops','support','readonly')),
  can_bulk_recalculate boolean DEFAULT false,
  can_send_notifications boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_select_self" ON public.admin_users
  FOR SELECT USING (auth.uid() = id);
