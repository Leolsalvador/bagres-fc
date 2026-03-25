# Planejamento do Projeto — Bagres FC

## Stack Definida

| Camada | Tecnologia | Motivo |
|---|---|---|
| Frontend | **React + Vite** (PWA) | Leve, rápido e instalável na tela inicial do celular sem App Store |
| Hospedagem | **Vercel** | Deploy automático via Git, HTTPS grátis, link compartilhável |
| Backend + Banco | **Supabase** | PostgreSQL + API + Auth + Storage prontos, plano grátis suficiente |
| Autenticação | **Supabase Auth** | Email/senha + login com Google (gratuito) |

O app será uma **PWA**: o pessoal acessa o link, o celular pergunta "Adicionar à tela inicial?" e vira um ícone como qualquer app — sem precisar de loja.

---

## Identidade Visual

Referência: **Cartola FC** — dark mode moderno com sotaque futebolístico.

### Paleta de cores
| Papel | Cor | Uso |
|---|---|---|
| Background principal | `#0D0D0D` ou `#111827` | Fundo das telas |
| Background card | `#1A1A2E` / `#1F2937` | Cards, listas, modais |
| Acento primário | `#00C853` (verde vibrante) | Botões principais, destaques, ativo |
| Acento secundário | `#FFD600` (amarelo) | Badges, artilheiro, destaque especial |
| Texto principal | `#F9FAFB` | Títulos e corpo |
| Texto secundário | `#9CA3AF` | Labels, placeholders, info auxiliar |
| Danger / rejeitar | `#EF4444` | Ações destrutivas, rejeitar pagamento |

### Tipografia
- Fonte: **Inter** ou **Roboto** (sans-serif, peso bold para títulos)
- Títulos de tela: bold, tamanho grande, uppercase quando for rótulo de seção
- Notas/ratings: destaque numérico grande com cor de acento

### Componentes-chave
- **Cards com bordas arredondadas** (`rounded-2xl`) e leve sombra interna — sem bordas brancas
- **Bottom navigation bar** fixa com ícones (igual Cartola) — sem menu hambúrguer
- **Avatar circular** com foto do jogador em todos os cards de pessoa
- **Badges coloridos** para status (Pago = verde, Pendente = amarelo, Rejeitado = vermelho)
- **Botões primários**: fundo verde vibrante, texto branco, cantos arredondados
- Micro-animações suaves em transições de tela e ao registrar gol/assist

### Biblioteca de componentes
- [ ] Definir e instalar: **Tailwind CSS** + **shadcn/ui** (componentes prontos, dark mode nativo)

---

## Fase 0: Configuração do Ambiente

### 0.1 — Contas e serviços
- [ ] Criar conta no [GitHub](https://github.com) e repositório do projeto
- [ ] Criar conta no [Supabase](https://supabase.com) e criar novo projeto
- [ ] Criar conta na [Vercel](https://vercel.com) e conectar ao repositório do GitHub

### 0.2 — Projeto local
- [ ] Criar projeto React + Vite: `npm create vite@latest bagres-fc -- --template react`
- [ ] Instalar dependências base:
  ```
  npm install @supabase/supabase-js react-router-dom
  npm install -D vite-plugin-pwa
  ```
- [ ] Configurar PWA no `vite.config.js` (ícone, nome do app, cor do tema)
- [ ] Configurar variáveis de ambiente (`.env`):
  ```
  VITE_SUPABASE_URL=...
  VITE_SUPABASE_ANON_KEY=...
  ```
- [ ] Fazer primeiro deploy na Vercel (conectar repo → deploy automático a cada push)

### 0.3 — Banco de dados (Supabase)
- [ ] Criar as tabelas no Supabase conforme modelo conceitual (seção final deste documento)
- [ ] Configurar Row Level Security (RLS): usuários só veem o que devem ver
- [ ] Criar bucket de Storage para fotos de perfil

### 0.4 — Notificações Push (PWA)
- [ ] Configurar **Web Push** via Supabase + service worker (gratuito)
- [ ] Notificações planejadas:
  - "A lista da pelada abriu! Garanta sua vaga 🟢"
  - "Você entrou da fila de espera para a lista principal!"
  - "Seu pagamento foi confirmado ✅"
  - "Seu pagamento foi devolvido — confirme novamente"
  - "Os times foram sorteados! Veja o seu time"
  - "A votação está aberta — avalie seus colegas"

### 0.5 — CI/CD
- [ ] Configurar variáveis de ambiente na Vercel (mesmas do `.env`)
- [ ] Validar: push no GitHub → build automático → link atualizado

---

## Fase 1: Base do Projeto (MVP Estrutural)

### 1.1 — Autenticação e Controle de Acesso
- [ ] Cadastro de novo usuário (status inicial: **Pendente**) via email/senha
- [ ] Login com **Google** (OAuth via Supabase — gratuito)
- [ ] Login com redirecionamento por papel (Admin / Aprovado / Pendente)
- [ ] Tela de bloqueio "Aguardando aprovação" para contas pendentes
- [ ] Middleware/guard de rotas por papel

### 1.2 — Administração de Usuários (Tela 6)
- [ ] Listagem de contas pendentes com ações Aprovar / Rejeitar
- [ ] Criação manual de usuário ou administrador
- [ ] Edição e exclusão de contas existentes

> **Por que primeiro:** Sem aprovação de contas nada mais funciona. É o desbloqueador de todo o fluxo.

---

## Fase 2: Ciclo da Rodada

### 2.1 — Abertura da Rodada (Tela 3A — pré-jogo)
- [ ] Job/cron que abre a lista automaticamente toda **quinta às 14:00** (jogo é na segunda)
- [ ] Botão manual para o admin abrir antes do prazo
- [ ] Admins cadastrados entram automaticamente como confirmados (primeiros da lista)

### 2.2 — Lista de Presença (Tela 3B — jogador)
- [ ] Botão "Entrar na lista" (lista principal até **20 pessoas**, restante vai para fila de espera)
- [ ] Quando alguém sai da lista principal, o primeiro da fila entra automaticamente
- [ ] Exibição da posição na fila de espera
- [ ] Botão "Confirmar Pagamento" e "Retirar nome"

### 2.3 — Gestão da Lista pelo Admin (Tela 3A)
- [ ] Visualizar lista completa (confirmados e fila)
- [ ] Remover jogadores da lista
- [ ] Validar / rejeitar pagamento de cada jogador
- [ ] Ao rejeitar: botão "Confirmar Pagamento" volta a aparecer para o jogador (Tela 3B)
- [ ] Indicador visual de quem pagou

### 2.4 — Fechamento e Sorteio
- [ ] Encerramento automático às 18:00 ou quando todos pagarem
- [ ] Algoritmo de sorteio de **4 times de 5 jogadores** balanceados pelo rating (melhor ranqueados distribuídos entre os times, sem concentrar os melhores em um só)
- [ ] Botão "Sortear Manualmente" para o admin forçar um novo sorteio
- [ ] Exibição dos times para todos os usuários

---

## Fase 3: Controle de Partida ao Vivo (Tela 3A — durante o jogo)

- [ ] Seleção do confronto ativo entre os 4 times
- [ ] Layout de "campinho": fotos dos 5 jogadores de cada time dispostas visualmente em campo (5 de cada lado)
- [ ] Cronômetro com tempo padrão de **8 minutos**, alerta sonoro/visual ao fim
- [ ] Cronômetro com controles: iniciar / pausar / zerar
- [ ] Registro de gol com seleção do jogador marcador
- [ ] Registro de assistência vinculada ao gol
- [ ] Marcação do time vitorioso
- [ ] Botão "Finalizar Jogo" (zera cronômetro, abre seleção do próximo confronto)

---

## Fase 4: Pós-Rodada e Estatísticas

### 4.1 — Encerramento
- [ ] Botão "Finalizar Rodada" pelo admin
- [ ] Atualização do banco: gols, assistências, jogos disputados por jogador
- [ ] Geração do resumo: Artilheiro, Garçom, Time da Rodada

### 4.2 — Histórico (Tela 2)
- [ ] Lista de jogadores aprovados com nota/rating atual
- [ ] Estatísticas globais de todo o período: Artilheiro e Garçom acumulados
- [ ] Filtro por rodada para ver as estatísticas de um evento específico
- [ ] Histórico de rodadas passadas
- [ ] Detalhe de cada rodada: Artilheiro, Garçom, Time da Rodada

### 4.3 — Perfil do Jogador (Tela 5)
- [ ] Exibição de métricas pessoais (gols, assistências, jogos, times)
- [ ] Formulário de edição de dados e foto

---

## Fase 5: Sistema de Votação (Tela 4)

- [ ] Interface estilo Tinder: exibe foto do jogador + campo para nota de **1 a 5**, um por vez
- [ ] Navegar por todos os colegas aprovados para avaliar
- [ ] Regra: um único voto por ciclo por usuário
- [ ] Bloqueio da tela após o voto ser registrado
- [ ] Rating calculado como **média de todas as votações** recebidas pelo jogador
- [ ] Votação **aberta manualmente pelo admin** (não automática ao finalizar rodada)
- [ ] Botão admin "Reabilitar Votação" para reabrir o ciclo se necessário

---

## Fase 6: Qualidade e Lançamento

- [ ] Testes de fluxo completo (cadastro → aprovação → rodada → partida → votação)
- [ ] Tratamento de edge cases da timeline (fuso horário, rodada sem quórum, etc.)
- [ ] Ajustes de UX mobile (toques, feedback visual, velocidade para uso na beira do campo)
- [ ] Deploy final na Vercel com domínio customizado (opcional)
- [ ] Verificar instalação PWA no Android e iOS
- [ ] Compartilhar link com o grupo e guiar instalação na tela inicial
- [ ] Onboarding dos primeiros usuários reais

---

## Dependências Críticas entre Fases

```
Fase 0 → Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5 → Fase 6
                     ↑
              (Fase 1.2 desbloqueia tudo)
```

- A **Fase 1** (auth + aprovação) é pré-requisito absoluto para qualquer outra tela funcionar.
- A **Fase 3** depende do sorteio da Fase 2 estar concluído.
- A **Fase 4** depende da Fase 3 para ter dados de gols/assistências.
- A **Fase 5** (votação) só faz sentido depois da Fase 4 (rodada encerrada com estatísticas).

---

## Dados Principais (modelo conceitual)

| Entidade | Atributos-chave |
|---|---|
| Usuário | id, nome, foto, papel, status, gols, assistências, jogos, rating |
| Rodada | id, data, status (aguardando/aberta/sorteada/em_jogo/encerrada) |
| Presença | usuário_id, rodada_id, status (confirmado/espera/pago) |
| Time | id, rodada_id, jogadores[] |
| Partida | id, rodada_id, time_a, time_b, placar, vencedor, duração |
| Evento (gol/assist) | partida_id, jogador_id, tipo, minuto |
| Voto | votante_id, avaliado_id, rodada_id, nota |
