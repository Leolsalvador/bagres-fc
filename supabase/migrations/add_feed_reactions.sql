-- Migration: add feed_reactions table
-- Run this in Supabase SQL editor

create table if not exists feed_reactions (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references feed_posts(id) on delete cascade,
  usuario_id  uuid not null references profiles(id) on delete cascade,
  emoji       text not null,
  created_at  timestamptz default now(),
  unique(post_id, usuario_id, emoji)
);

alter table feed_reactions enable row level security;

create policy "Usuários autenticados podem ver reações"
  on feed_reactions for select
  to authenticated
  using (true);

create policy "Usuários inserem suas próprias reações"
  on feed_reactions for insert
  to authenticated
  with check (auth.uid() = usuario_id);

create policy "Usuários removem suas próprias reações"
  on feed_reactions for delete
  to authenticated
  using (auth.uid() = usuario_id);
