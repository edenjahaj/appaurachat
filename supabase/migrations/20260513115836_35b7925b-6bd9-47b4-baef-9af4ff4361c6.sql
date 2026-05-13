
CREATE OR REPLACE FUNCTION public.is_admin_or_owner(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('owner','admin','moderator'));
$$;

CREATE TABLE IF NOT EXISTS public.user_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  banned_by uuid NOT NULL,
  reason text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'ban',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner/admins read all bans" ON public.user_bans;
CREATE POLICY "Owner/admins read all bans" ON public.user_bans FOR SELECT TO authenticated
  USING (public.is_admin_or_owner(auth.uid()) OR user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_banned(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_bans WHERE user_id = _user_id AND (expires_at IS NULL OR expires_at > now()));
$$;

CREATE TABLE IF NOT EXISTS public.user_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  issued_by uuid NOT NULL,
  reason text NOT NULL,
  acknowledged boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner/admins or recipient read warnings" ON public.user_warnings;
CREATE POLICY "Owner/admins or recipient read warnings" ON public.user_warnings FOR SELECT TO authenticated
  USING (public.is_admin_or_owner(auth.uid()) OR user_id = auth.uid());
DROP POLICY IF EXISTS "Recipient can ack warning" ON public.user_warnings;
CREATE POLICY "Recipient can ack warning" ON public.user_warnings FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON public.audit_logs (created_at DESC);
DROP POLICY IF EXISTS "Owner/admins read audit" ON public.audit_logs;
CREATE POLICY "Owner/admins read audit" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));

CREATE OR REPLACE FUNCTION public.log_audit(_action text, _target_type text, _target_id text, _details jsonb)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.audit_logs(actor_id, action, target_type, target_id, details)
  VALUES (auth.uid(), _action, _target_type, _target_id, COALESCE(_details, '{}'::jsonb));
$$;

CREATE TABLE IF NOT EXISTS public.platform_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  pinned boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone authed reads active platform announcements" ON public.platform_announcements;
CREATE POLICY "Anyone authed reads active platform announcements" ON public.platform_announcements
  FOR SELECT TO authenticated USING (active = true OR public.is_admin_or_owner(auth.uid()));
DROP POLICY IF EXISTS "Owner manages platform announcements insert" ON public.platform_announcements;
CREATE POLICY "Owner manages platform announcements insert" ON public.platform_announcements
  FOR INSERT TO authenticated WITH CHECK (public.is_owner(auth.uid()));
DROP POLICY IF EXISTS "Owner manages platform announcements update" ON public.platform_announcements;
CREATE POLICY "Owner manages platform announcements update" ON public.platform_announcements
  FOR UPDATE TO authenticated USING (public.is_owner(auth.uid()));
DROP POLICY IF EXISTS "Owner manages platform announcements delete" ON public.platform_announcements;
CREATE POLICY "Owner manages platform announcements delete" ON public.platform_announcements
  FOR DELETE TO authenticated USING (public.is_owner(auth.uid()));

CREATE TABLE IF NOT EXISTS public.keyword_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern text NOT NULL UNIQUE,
  severity text NOT NULL DEFAULT 'flag',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.keyword_filters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner/admins read filters" ON public.keyword_filters;
CREATE POLICY "Owner/admins read filters" ON public.keyword_filters FOR SELECT TO authenticated
  USING (public.is_admin_or_owner(auth.uid()));
DROP POLICY IF EXISTS "Owner manages filters insert" ON public.keyword_filters;
CREATE POLICY "Owner manages filters insert" ON public.keyword_filters FOR INSERT TO authenticated
  WITH CHECK (public.is_owner(auth.uid()));
DROP POLICY IF EXISTS "Owner manages filters delete" ON public.keyword_filters;
CREATE POLICY "Owner manages filters delete" ON public.keyword_filters FOR DELETE TO authenticated
  USING (public.is_owner(auth.uid()));

DROP POLICY IF EXISTS "Members can send messages" ON public.messages;
CREATE POLICY "Members can send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()) AND NOT public.is_banned(auth.uid()));

DROP POLICY IF EXISTS "Members can send (admins only in announcements)" ON public.channel_messages;
CREATE POLICY "Members can send (admins only in announcements)" ON public.channel_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_class_member(public.channel_class(channel_id), auth.uid())
    AND ((NOT public.channel_is_announcements(channel_id)) OR public.is_class_admin(public.channel_class(channel_id), auth.uid()))
    AND NOT public.is_banned(auth.uid()));

CREATE OR REPLACE FUNCTION public.admin_ban_user(_user_id uuid, _reason text, _severity text DEFAULT 'ban', _hours int DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_owner(auth.uid()) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF public.is_owner(_user_id) THEN RAISE EXCEPTION 'Cannot ban the owner'; END IF;
  INSERT INTO public.user_bans(user_id, banned_by, reason, severity, expires_at)
  VALUES (_user_id, auth.uid(), COALESCE(_reason,''), COALESCE(_severity,'ban'),
          CASE WHEN _hours IS NOT NULL THEN now() + make_interval(hours => _hours) ELSE NULL END)
  ON CONFLICT (user_id) DO UPDATE SET reason=EXCLUDED.reason, severity=EXCLUDED.severity, expires_at=EXCLUDED.expires_at, banned_by=EXCLUDED.banned_by, created_at=now();
  PERFORM public.log_audit('ban_user','user',_user_id::text, jsonb_build_object('reason',_reason,'severity',_severity,'hours',_hours));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_unban_user(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_owner(auth.uid()) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  DELETE FROM public.user_bans WHERE user_id = _user_id;
  PERFORM public.log_audit('unban_user','user',_user_id::text,'{}'::jsonb);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_warn_user(_user_id uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_or_owner(auth.uid()) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  INSERT INTO public.user_warnings(user_id, issued_by, reason) VALUES (_user_id, auth.uid(), _reason);
  PERFORM public.log_audit('warn_user','user',_user_id::text, jsonb_build_object('reason',_reason));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_grant_moderator(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_owner(auth.uid()) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (_user_id, 'moderator') ON CONFLICT DO NOTHING;
  PERFORM public.log_audit('grant_moderator','user',_user_id::text,'{}'::jsonb);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_revoke_moderator(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_owner(auth.uid()) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'moderator';
  PERFORM public.log_audit('revoke_moderator','user',_user_id::text,'{}'::jsonb);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_delete_user_content(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_owner(auth.uid()) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  DELETE FROM public.messages WHERE sender_id = _user_id;
  DELETE FROM public.channel_messages WHERE sender_id = _user_id;
  DELETE FROM public.stories WHERE user_id = _user_id;
  PERFORM public.log_audit('purge_content','user',_user_id::text,'{}'::jsonb);
END; $$;

CREATE OR REPLACE FUNCTION public.owner_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r jsonb;
BEGIN
  IF NOT public.is_admin_or_owner(auth.uid()) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT jsonb_build_object(
    'total_users', (SELECT count(*) FROM public.profiles),
    'total_messages', (SELECT count(*) FROM public.messages) + (SELECT count(*) FROM public.channel_messages),
    'messages_today', (SELECT count(*) FROM public.messages WHERE created_at > now() - interval '1 day') + (SELECT count(*) FROM public.channel_messages WHERE created_at > now() - interval '1 day'),
    'messages_week', (SELECT count(*) FROM public.messages WHERE created_at > now() - interval '7 days') + (SELECT count(*) FROM public.channel_messages WHERE created_at > now() - interval '7 days'),
    'new_users_week', (SELECT count(*) FROM public.profiles WHERE created_at > now() - interval '7 days'),
    'active_bans', (SELECT count(*) FROM public.user_bans WHERE expires_at IS NULL OR expires_at > now()),
    'open_reports', (SELECT count(*) FROM public.message_reports),
    'total_classes', (SELECT count(*) FROM public.classes),
    'total_conversations', (SELECT count(*) FROM public.conversations)
  ) INTO r;
  RETURN r;
END; $$;
