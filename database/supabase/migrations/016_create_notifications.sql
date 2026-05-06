-- 016: Notifications — in-app + push + email
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category text NOT NULL
    CHECK (category IN ('sip','tax','goal','planning','system')),
  title text NOT NULL,
  body text NOT NULL,
  action_url text,
  is_read boolean DEFAULT false,
  sent_via text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notif_unread ON public.notifications(user_id, is_read)
  WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_own" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);
