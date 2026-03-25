-- ============================================================
-- Bagres FC — Schema do banco de dados (Supabase / PostgreSQL)
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- PROFILES (estende auth.users com dados do jogador)
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  nome        text not null,
  foto_url    text,
  papel       text not null default 'usuario' check (papel in ('admin', 'usuario')),
  status      text not null default 'pendente' check (status in ('pendente', 'aprovado', 'rejeitado')),
  gols        int  not null default 0,
  assistencias int not null default 0,
  jogos       int  not null default 0,
  rating      numeric(3,2) not null default 0,
  created_at  timestamptz default now()
);

-- RODADAS
create table public.rodadas (
  id              uuid primary key default gen_random_uuid(),
  data_jogo       date not null, -- Segunda-feira do evento
  status          text not null default 'aguardando'
                    check (status in ('aguardando','aberta','sorteada','em_jogo','encerrada')),
  artilheiro_id   uuid references public.profiles(id),
  garcom_id       uuid references public.profiles(id),
  created_at      timestamptz default now()
);

-- PRESENÇAS (lista de confirmados e fila de espera)
create table public.presencas (
  id          uuid primary key default gen_random_uuid(),
  rodada_id   uuid not null references public.rodadas(id) on delete cascade,
  usuario_id  uuid not null references public.profiles(id) on delete cascade,
  -- 1-20: lista principal; 21+: fila de espera
  posicao     int  not null,
  -- 'confirmado' = na lista; 'espera' = na fila; 'pago' = pagamento validado
  status      text not null default 'confirmado'
                check (status in ('confirmado','espera','pago')),
  created_at  timestamptz default now(),
  unique(rodada_id, usuario_id),
  unique(rodada_id, posicao)
);

-- TIMES (4 times por rodada)
create table public.times (
  id          uuid primary key default gen_random_uuid(),
  rodada_id   uuid not null references public.rodadas(id) on delete cascade,
  numero      int  not null check (numero in (1,2,3,4)),
  nome        text not null, -- Ex: "Time 1"
  unique(rodada_id, numero)
);

-- TIME_JOGADORES (relação N:N entre times e jogadores)
create table public.time_jogadores (
  time_id     uuid not null references public.times(id) on delete cascade,
  usuario_id  uuid not null references public.profiles(id) on delete cascade,
  primary key (time_id, usuario_id)
);

-- PARTIDAS
create table public.partidas (
  id              uuid primary key default gen_random_uuid(),
  rodada_id       uuid not null references public.rodadas(id) on delete cascade,
  time_a_id       uuid not null references public.times(id),
  time_b_id       uuid not null references public.times(id),
  gols_a          int  not null default 0,
  gols_b          int  not null default 0,
  vencedor_id     uuid references public.times(id),
  duracao_segundos int,
  status          text not null default 'pendente'
                    check (status in ('pendente','em_jogo','encerrada')),
  created_at      timestamptz default now()
);

-- EVENTOS (gols e assistências de uma partida)
create table public.eventos (
  id          uuid primary key default gen_random_uuid(),
  partida_id  uuid not null references public.partidas(id) on delete cascade,
  usuario_id  uuid not null references public.profiles(id),
  tipo        text not null check (tipo in ('gol','assistencia')),
  minuto      int,
  created_at  timestamptz default now()
);

-- CICLOS DE VOTAÇÃO
create table public.ciclos_votacao (
  id          uuid primary key default gen_random_uuid(),
  rodada_id   uuid references public.rodadas(id),
  aberta      boolean not null default false,
  created_at  timestamptz default now()
);

-- VOTOS
create table public.votos (
  id          uuid primary key default gen_random_uuid(),
  ciclo_id    uuid not null references public.ciclos_votacao(id) on delete cascade,
  votante_id  uuid not null references public.profiles(id) on delete cascade,
  avaliado_id uuid not null references public.profiles(id) on delete cascade,
  nota        int  not null check (nota between 1 and 5),
  created_at  timestamptz default now(),
  unique(ciclo_id, votante_id, avaliado_id)
);

-- ============================================================
-- TRIGGER: cria profile automaticamente ao cadastrar usuário
-- (cobre tanto email/senha quanto Google OAuth)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome, papel, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'usuario',
    'pendente'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
alter table public.profiles       enable row level security;
alter table public.rodadas        enable row level security;
alter table public.presencas      enable row level security;
alter table public.times          enable row level security;
alter table public.time_jogadores enable row level security;
alter table public.partidas       enable row level security;
alter table public.eventos        enable row level security;
alter table public.ciclos_votacao enable row level security;
alter table public.votos          enable row level security;

-- Profiles: leitura pública de aprovados; atualização apenas do próprio perfil
create policy "Leitura de perfis aprovados" on public.profiles
  for select using (status = 'aprovado' or auth.uid() = id);

create policy "Atualização do próprio perfil" on public.profiles
  for update using (auth.uid() = id);

-- Admin pode ver e editar todos os perfis
create policy "Admin lê todos os perfis" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and papel = 'admin')
  );

create policy "Admin atualiza qualquer perfil" on public.profiles
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and papel = 'admin')
  );

-- Rodadas: todos aprovados leem; apenas admin escreve
create policy "Leitura de rodadas" on public.rodadas
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and status = 'aprovado')
  );

create policy "Admin gerencia rodadas" on public.rodadas
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and papel = 'admin')
  );

-- Presenças: todos aprovados leem; usuário insere/atualiza a própria; admin atualiza qualquer
create policy "Leitura de presenças" on public.presencas
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and status = 'aprovado')
  );

create policy "Usuário gerencia própria presença" on public.presencas
  for all using (auth.uid() = usuario_id);

create policy "Admin gerencia presenças" on public.presencas
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and papel = 'admin')
  );

-- Times, partidas, eventos: leitura para aprovados; escrita para admin
create policy "Leitura de times" on public.times
  for select using (exists (select 1 from public.profiles where id = auth.uid() and status = 'aprovado'));
create policy "Admin gerencia times" on public.times
  for all using (exists (select 1 from public.profiles where id = auth.uid() and papel = 'admin'));

create policy "Leitura de time_jogadores" on public.time_jogadores
  for select using (exists (select 1 from public.profiles where id = auth.uid() and status = 'aprovado'));
create policy "Admin gerencia time_jogadores" on public.time_jogadores
  for all using (exists (select 1 from public.profiles where id = auth.uid() and papel = 'admin'));

create policy "Leitura de partidas" on public.partidas
  for select using (exists (select 1 from public.profiles where id = auth.uid() and status = 'aprovado'));
create policy "Admin gerencia partidas" on public.partidas
  for all using (exists (select 1 from public.profiles where id = auth.uid() and papel = 'admin'));

create policy "Leitura de eventos" on public.eventos
  for select using (exists (select 1 from public.profiles where id = auth.uid() and status = 'aprovado'));
create policy "Admin gerencia eventos" on public.eventos
  for all using (exists (select 1 from public.profiles where id = auth.uid() and papel = 'admin'));

-- Votação: leitura pública dos ciclos; votos apenas o próprio
create policy "Leitura de ciclos" on public.ciclos_votacao
  for select using (exists (select 1 from public.profiles where id = auth.uid() and status = 'aprovado'));
create policy "Admin gerencia ciclos" on public.ciclos_votacao
  for all using (exists (select 1 from public.profiles where id = auth.uid() and papel = 'admin'));

create policy "Usuário insere próprio voto" on public.votos
  for insert with check (auth.uid() = votante_id);
create policy "Usuário lê próprio voto" on public.votos
  for select using (auth.uid() = votante_id);
create policy "Admin lê todos os votos" on public.votos
  for select using (exists (select 1 from public.profiles where id = auth.uid() and papel = 'admin'));
