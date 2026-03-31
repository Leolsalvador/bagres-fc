-- Adiciona flag para ciclos de votação exclusivos de admins
alter table public.ciclos_votacao
  add column if not exists apenas_admins boolean not null default false;
