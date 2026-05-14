
-- Owner super-powers: force sign-out, delete account, broadcast DM, maintenance mode, platform settings.

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone can read settings" ON public.platform_settings;
CREATE POLICY "anyone can read settings" ON public.platform_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "owners write settings" ON public.platform_settings;
CREATE POLICY "owners write settings" ON public.platform_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- Force sign-out: revoke all refresh tokens for a target user
CREATE OR REPLACE FUNCTION public.admin_force_signout(_target uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE auth.refresh_tokens SET revoked = true WHERE user_id::uuid = _target;
  INSERT INTO public.audit_logs(actor_id, action, target_user_id, details)
  VALUES (auth.uid(), 'force_signout', _target, '{}'::jsonb);
END;
$$;

-- Delete account: owner-only, removes the auth user (cascade clears app data)
CREATE OR REPLACE FUNCTION public.admin_delete_account(_target uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner') THEN
    RAISE EXCEPTION 'Owner only';
  END IF;
  IF _target = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete yourself';
  END IF;
  DELETE FROM auth.users WHERE id = _target;
  INSERT INTO public.audit_logs(actor_id, action, target_user_id, details)
  VALUES (auth.uid(), 'delete_account', _target, '{}'::jsonb);
END;
$$;

-- Broadcast DM: send a message from owner to every user (creates 1:1 conversations as needed)
CREATE OR REPLACE FUNCTION public.admin_broadcast_dm(_content text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u record; convo uuid; sent integer := 0; me uuid := auth.uid();
BEGIN
  IF NOT public.has_role(me, 'owner') THEN RAISE EXCEPTION 'Owner only'; END IF;
  IF length(coalesce(_content,'')) = 0 THEN RAISE EXCEPTION 'Empty message'; END IF;
  FOR u IN SELECT id FROM auth.users WHERE id <> me LOOP
    SELECT c.id INTO convo
      FROM conversations c
      JOIN conversation_members m1 ON m1.conversation_id = c.id AND m1.user_id = me
      JOIN conversation_members m2 ON m2.conversation_id = c.id AND m2.user_id = u.id
     WHERE c.is_group = false LIMIT 1;
    IF convo IS NULL THEN
      INSERT INTO conversations(is_group, created_by) VALUES (false, me) RETURNING id INTO convo;
      INSERT INTO conversation_members(conversation_id, user_id) VALUES (convo, me), (convo, u.id);
    END IF;
    INSERT INTO messages(conversation_id, sender_id, content) VALUES (convo, me, _content);
    sent := sent + 1;
  END LOOP;
  INSERT INTO public.audit_logs(actor_id, action, details)
  VALUES (me, 'broadcast_dm', jsonb_build_object('sent', sent));
  RETURN sent;
END;
$$;

-- Maintenance toggle helper
CREATE OR REPLACE FUNCTION public.admin_set_maintenance(_on boolean, _message text DEFAULT 'Under maintenance')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner') THEN RAISE EXCEPTION 'Owner only'; END IF;
  INSERT INTO public.platform_settings(key, value, updated_by)
  VALUES ('maintenance', jsonb_build_object('on', _on, 'message', _message), auth.uid())
  ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now(), updated_by = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_force_signout(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_account(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_broadcast_dm(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_maintenance(boolean, text) TO authenticated;
