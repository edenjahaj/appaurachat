
-- Read receipts
ALTER TABLE public.conversation_members ADD COLUMN IF NOT EXISTS last_read_at timestamptz NOT NULL DEFAULT now();

-- Image attachments on messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.messages ALTER COLUMN content DROP NOT NULL;

-- Touch conversation trigger if missing
DROP TRIGGER IF EXISTS messages_touch_conversation ON public.messages;
CREATE TRIGGER messages_touch_conversation
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.touch_conversation();

-- Mark read RPC
CREATE OR REPLACE FUNCTION public.mark_conversation_read(_conversation_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.conversation_members
  SET last_read_at = now()
  WHERE conversation_id = _conversation_id AND user_id = auth.uid();
$$;

-- Realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_members REPLICA IDENTITY FULL;
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='messages';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages; END IF;
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='conversation_members';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members; END IF;
END $$;

-- Storage bucket for chat media
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat-media
DROP POLICY IF EXISTS "chat media public read" ON storage.objects;
CREATE POLICY "chat media public read" ON storage.objects
FOR SELECT USING (bucket_id = 'chat-media');

DROP POLICY IF EXISTS "users upload to own folder" ON storage.objects;
CREATE POLICY "users upload to own folder" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "users delete own files" ON storage.objects;
CREATE POLICY "users delete own files" ON storage.objects
FOR DELETE USING (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);
