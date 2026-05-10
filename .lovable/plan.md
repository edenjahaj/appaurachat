This is a large transformation. To keep AURA stable, I'll ship it in **3 phases** instead of one mega-change. You approve this plan, then I implement Phase 1 first, you confirm it works, and we move to Phase 2, etc.

The existing **DMs, groups, stories, auth, presence, install prompt** stay 100% intact — this is purely additive.

---

## Phase 1 — Classes, channels & announcements (foundation)

**New database tables (additive, no edits to existing tables):**
- `classes` — id, name, join_code (6-char), created_by, created_at
- `class_members` — class_id, user_id, role ('admin' | 'student'), joined_at
- `channels` — id, class_id, slug ('general'/'homework'/'announcements'/etc), name, icon, description, is_announcements
- `channel_messages` — id, channel_id, sender_id, content, parent_id (for replies), pinned, edited_at, deleted_at
- `channel_reads` — channel_id, user_id, last_read_at
- `announcements` — id, class_id, author_id, title, body, severity ('normal'|'important'|'critical'), pinned, created_at
- `announcement_reads` — announcement_id, user_id, read_at

RLS: members of a class can read its channels/messages/announcements; only admins post in announcement channels and create announcements; senders can edit/delete their own messages.

RPCs: `create_class(name)`, `join_class(code)`, `mark_channel_read(channel_id)`, `mark_announcement_read(id)`.
Trigger: when a class is created, auto-create the 6 default channels (#general, #homework, #announcements, #memes, #study-help, #random) and make creator admin.

**New routes/UI:**
- `/app/classes` — list of classes + "Create class" + "Join with code" dialog
- `/app/c/$classId/$channelSlug` — Discord-style: channel sidebar (left) + messages (right)
- `/app/c/$classId/announcements` — card-based announcement feed with severity colors, pin-to-top, mark-as-read
- Sidebar gets a new "Classes" section with unread badges per class

Theme polish: tighten dark mode tokens (deep charcoal bg, purple/cyan gradient accents, 14px radius, 200ms transitions) — applied as token edits in `styles.css` so existing components inherit automatically.

## Phase 2 — Message power-ups & search

- Emoji reactions (🔥😂❤️👍😮) — new `message_reactions` table, hover bar
- Reply / quote (uses `parent_id` from Phase 1)
- Edit & delete own messages (UI for existing RLS)
- Pin messages (admin only) + pinned panel per channel
- Per-channel message search with highlight + jump-to-message
- Typing indicators per channel (Realtime broadcast, same pattern as DMs)
- Delivery states: sending / sent / seen
- Same features back-ported to existing DMs

## Phase 3 — Mobile shell & profile polish

- Bottom navigation bar on mobile (Chats / Classes / Announcements / Profile)
- Collapsible sidebar drawer
- Profile page: avatar upload, display name, status text, role badges
- Notification bell with unified inbox
- Optional sound toggle in settings
- Onboarding tour for first-time users

---

## Things I'm intentionally NOT doing

- Not touching the existing `conversations` / `messages` / `profiles` tables (DMs keep working unchanged)
- Not adding mentions (you marked it optional/future)
- Not adding light-theme toggle yet (optional, low value vs effort)
- Not adding service worker / offline cache (already covered in PWA pass; would re-break preview)

---

## Technical notes

- All realtime via existing Supabase Realtime channels (no new infra)
- Lazy-load announcement and class routes via TanStack Router code splitting
- Reuse `RealtimeProvider` pattern; add channel-scoped unread map alongside conversation unread map
- Storage bucket `chat-media` reused for class-channel images

**Confirm and I'll start Phase 1 (DB migration + classes/channels/announcements UI). Or tell me to reorder, drop, or expand any phase.**