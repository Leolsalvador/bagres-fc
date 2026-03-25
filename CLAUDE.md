# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Bagres FC** is a mobile-first web application for managing casual weekly football games ("peladas"). The full specification is in `projeto.md`. The project is currently in the planning phase — no implementation code exists yet.

The app's core loop: players register → admin approves → every Thursday a round opens → players confirm attendance and pay → teams are drawn → admin controls the live match (timer, goals, assists) → round ends and statistics are updated → players vote to rate each other.

## Technology Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + Vite (PWA) |
| Estilo | Tailwind CSS + shadcn/ui |
| Backend + Banco | Supabase (PostgreSQL + Auth + Storage) |
| Hospedagem | Vercel |

**Comandos:**
- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
- Instalar dependências: `npm install`

## Design System

Referência visual: **Cartola FC** — dark mode moderno com sotaque futebolístico.

- **Background**: `#0D0D0D` / `#111827` (telas), `#1F2937` (cards)
- **Acento primário**: `#00C853` (verde) — botões, estados ativos, confirmações
- **Acento secundário**: `#FFD600` (amarelo) — badges de destaque, artilheiro
- **Danger**: `#EF4444` — rejeitar, remover, erro
- **Texto**: `#F9FAFB` (principal), `#9CA3AF` (secundário)
- Navegação por **bottom navigation bar** fixa (não menu hambúrguer)
- Cards com `rounded-2xl`, avatares circulares com foto do jogador
- Badges coloridos para status: Pago (verde) / Pendente (amarelo) / Rejeitado (vermelho)
- Fonte: **Inter** ou **Roboto**, bold em títulos

## Architecture & Business Logic

### User Roles

| Role | Access |
|---|---|
| Admin | All screens + exclusive screens 3A and 6 |
| Approved User | Screens 1, 2, 3B, 4, 5 |
| Pending User | Blocked — "Awaiting approval" screen only |

### Round Timeline (weekly cycle)

- **Mon–Thu before 14:00**: List is closed; admin can open manually
- **Thu 14:00**: List auto-opens (max 20 players); admins are auto-added as confirmed first
- **Thu 18:00 OR when all 20 confirmed players pay**: List closes, drawn teams revealed
- **Monday**: Game day
- **Post-game**: Admin finalizes round → stats updated → admin manually opens voting

### Screen Map

| Screen | Who | Purpose |
|---|---|---|
| Tela 1 | Everyone | Login/registration + pending-user block |
| Tela 2 | All approved | Player directory with ratings + round history |
| Tela 3A | Admin only | Round control: pre-game list management, live match timer/goals/assists, post-game summary |
| Tela 3B | Players | Round participation: join list, confirm payment, view drawn teams, view final summary |
| Tela 4 | All approved | One-vote-per-cycle player rating; admin can re-enable voting |
| Tela 5 | All approved | Personal stats (goals, assists, games) + profile editing |
| Tela 6 | Admin only | Approve/reject pending accounts, create/edit/delete users |

### Key Business Rules

- New registrations are always **Pending** until an admin approves via Tela 6.
- Tela 3A (admin) and Tela 3B (player) are parallel views of the same round — different UIs for different roles.
- Teams: 4 teams are drawn; admin selects the active match pair and records results.
- Post-round summary includes: **Artilheiro** (top scorer), **Garçom** (top assists), and **Time da Rodada** (team of the round).
- Voting (Tela 4) is one-shot per cycle; the admin opens and re-enables voting manually.
- Push notifications (Web Push via PWA) are triggered by key round events: list open, queue promotion, payment confirmed/rejected, teams drawn, voting open.
