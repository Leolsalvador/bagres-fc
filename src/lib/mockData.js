// Dados mockados para desenvolvimento — remover antes do deploy
// Para ativar/desativar: altere USE_MOCK abaixo
export const USE_MOCK = false

// ─── Usuário logado (admin) ───────────────────────────────────
export const mockCurrentUser = {
  id: 'u-admin',
  nome: 'Leonardo Salvador',
  email: 'leo@bagres.com',
  rating: 4.2,
  gols: 8,
  assistencias: 5,
  jogos: 20,
  foto_url: null,
  papel: 'admin',
  status: 'aprovado',
}

// ─── Jogadores aprovados ──────────────────────────────────────
export const mockPlayers = [
  { id: 'u01', nome: 'Carlos Silva',        email: 'carlos@mock.com',    rating: 4.8, gols: 15, assistencias: 8,  jogos: 20, foto_url: null, papel: 'usuario', status: 'aprovado' },
  { id: 'u02', nome: 'João Santos',         email: 'joao@mock.com',      rating: 4.5, gols: 12, assistencias: 10, jogos: 18, foto_url: null, papel: 'usuario', status: 'aprovado' },
  { id: 'u03', nome: 'Pedro Oliveira',      email: 'pedro@mock.com',     rating: 4.3, gols: 9,  assistencias: 6,  jogos: 17, foto_url: null, papel: 'usuario', status: 'aprovado' },
  { id: 'u04', nome: 'Lucas Costa',         email: 'lucas@mock.com',     rating: 4.1, gols: 11, assistencias: 4,  jogos: 16, foto_url: null, papel: 'usuario', status: 'aprovado' },
  { id: 'u05', nome: 'Gabriel Souza',       email: 'gabriel@mock.com',   rating: 3.9, gols: 7,  assistencias: 9,  jogos: 15, foto_url: null, papel: 'usuario', status: 'aprovado' },
  { id: 'u06', nome: 'Matheus Lima',        email: 'matheus@mock.com',   rating: 3.7, gols: 6,  assistencias: 5,  jogos: 14, foto_url: null, papel: 'usuario', status: 'aprovado' },
  { id: 'u07', nome: 'Rafael Ferreira',     email: 'rafael@mock.com',    rating: 3.6, gols: 5,  assistencias: 7,  jogos: 14, foto_url: null, papel: 'usuario', status: 'aprovado' },
  { id: 'u08', nome: 'André Rodrigues',     email: 'andre@mock.com',     rating: 3.4, gols: 4,  assistencias: 3,  jogos: 13, foto_url: null, papel: 'usuario', status: 'aprovado' },
  { id: 'u09', nome: 'Felipe Alves',        email: 'felipe@mock.com',    rating: 3.2, gols: 8,  assistencias: 2,  jogos: 12, foto_url: null, papel: 'usuario', status: 'aprovado' },
  { id: 'u10', nome: 'Bruno Martins',       email: 'bruno@mock.com',     rating: 3.1, gols: 3,  assistencias: 4,  jogos: 12, foto_url: null, papel: 'usuario', status: 'aprovado' },
  { id: 'u11', nome: 'Diego Pereira',       email: 'diego@mock.com',     rating: 3.0, gols: 5,  assistencias: 3,  jogos: 11, foto_url: null, papel: 'usuario', status: 'aprovado' },
  { id: 'u12', nome: 'Thiago Gomes',        email: 'thiago@mock.com',    rating: 2.9, gols: 2,  assistencias: 5,  jogos: 11, foto_url: null, papel: 'usuario', status: 'aprovado' },
  { id: 'u13', nome: 'Leandro Ribeiro',     email: 'leandro@mock.com',   rating: 2.8, gols: 4,  assistencias: 2,  jogos: 10, foto_url: null, papel: 'usuario', status: 'aprovado' },
  { id: 'u14', nome: 'Rodrigo Carvalho',    email: 'rodrigo@mock.com',   rating: 2.7, gols: 1,  assistencias: 3,  jogos: 10, foto_url: null, papel: 'usuario', status: 'aprovado' },
  { id: 'u15', nome: 'Marcelo Nascimento',  email: 'marcelo@mock.com',   rating: 2.6, gols: 3,  assistencias: 1,  jogos: 9,  foto_url: null, papel: 'usuario', status: 'aprovado' },
  { id: 'u16', nome: 'Gustavo Araújo',      email: 'gustavo@mock.com',   rating: 2.5, gols: 2,  assistencias: 2,  jogos: 9,  foto_url: null, papel: 'usuario', status: 'aprovado' },
  { id: 'u17', nome: 'Vinícius Mendes',     email: 'vinicius@mock.com',  rating: 2.4, gols: 1,  assistencias: 1,  jogos: 8,  foto_url: null, papel: 'usuario', status: 'aprovado' },
  { id: 'u18', nome: 'Eduardo Cardoso',     email: 'eduardo@mock.com',   rating: 2.3, gols: 0,  assistencias: 2,  jogos: 7,  foto_url: null, papel: 'usuario', status: 'aprovado' },
  { id: 'u19', nome: 'Leonardo Barbosa',    email: 'lbarbosa@mock.com',  rating: 2.2, gols: 1,  assistencias: 0,  jogos: 6,  foto_url: null, papel: 'usuario', status: 'aprovado' },
  { id: 'u20', nome: 'Henrique Moreira',    email: 'henrique@mock.com',  rating: 2.0, gols: 0,  assistencias: 1,  jogos: 5,  foto_url: null, papel: 'usuario', status: 'aprovado' },
  // novos jogadores
  { id: 'u21', nome: 'Fábio Teixeira',      email: 'fabio@mock.com',     rating: 3.5, gols: 6,  assistencias: 4,  jogos: 13, foto_url: null, papel: 'usuario', status: 'aprovado' },
  { id: 'u22', nome: 'Igor Nascimento',     email: 'igor@mock.com',      rating: 3.3, gols: 4,  assistencias: 3,  jogos: 10, foto_url: null, papel: 'usuario', status: 'aprovado' },
  { id: 'u23', nome: 'Caio Fernandes',      email: 'caio@mock.com',      rating: 0.0, gols: 0,  assistencias: 0,  jogos: 0,  foto_url: null, papel: 'usuario', status: 'pendente' },
  { id: 'u24', nome: 'Renato Pires',        email: 'renato@mock.com',    rating: 0.0, gols: 0,  assistencias: 0,  jogos: 0,  foto_url: null, papel: 'usuario', status: 'pendente' },
  { id: 'u25', nome: 'Augusto Braga',       email: 'augusto@mock.com',   rating: 0.0, gols: 0,  assistencias: 0,  jogos: 0,  foto_url: null, papel: 'usuario', status: 'rejeitado' },
]

// Todos os profiles (para tela de Usuários — admin)
export const mockAllProfiles = [mockCurrentUser, ...mockPlayers]

// ─── Histórico de rodadas encerradas (Home) ───────────────────
export const mockRodadasHistory = [
  {
    id: 'r-hist-1',
    data_jogo: '2026-03-17',
    artilheiro: { nome: 'Carlos Silva',    gols: 4 },
    garcom:     { nome: 'João Santos',     assistencias: 3 },
    timeDaRodada: { nome: 'Time Azul',    vitorias: 3 },
    partidas: [
      { teamA: 'Time Azul',     teamB: 'Time Vermelho', goalsA: 3, goalsB: 1, winner: 'A' },
      { teamA: 'Time Amarelo',  teamB: 'Time Verde',    goalsA: 2, goalsB: 2, winner: 'draw' },
      { teamA: 'Time Azul',     teamB: 'Time Verde',    goalsA: 2, goalsB: 0, winner: 'A' },
      { teamA: 'Time Vermelho', teamB: 'Time Amarelo',  goalsA: 1, goalsB: 2, winner: 'B' },
      { teamA: 'Time Azul',     teamB: 'Time Amarelo',  goalsA: 1, goalsB: 1, winner: 'draw' },
    ],
  },
  {
    id: 'r-hist-2',
    data_jogo: '2026-03-10',
    artilheiro: { nome: 'Pedro Oliveira',  gols: 3 },
    garcom:     { nome: 'Gabriel Souza',   assistencias: 2 },
    timeDaRodada: { nome: 'Time Verde',   vitorias: 2 },
    partidas: [
      { teamA: 'Time Azul',    teamB: 'Time Verde',    goalsA: 1, goalsB: 2, winner: 'B' },
      { teamA: 'Time Amarelo', teamB: 'Time Vermelho', goalsA: 0, goalsB: 1, winner: 'B' },
      { teamA: 'Time Verde',   teamB: 'Time Vermelho', goalsA: 2, goalsB: 1, winner: 'A' },
      { teamA: 'Time Azul',    teamB: 'Time Amarelo',  goalsA: 3, goalsB: 0, winner: 'A' },
    ],
  },
  {
    id: 'r-hist-3',
    data_jogo: '2026-03-03',
    artilheiro: { nome: 'Lucas Costa',     gols: 5 },
    garcom:     { nome: 'Rafael Ferreira', assistencias: 3 },
    timeDaRodada: { nome: 'Time Vermelho', vitorias: 3 },
    partidas: [
      { teamA: 'Time Vermelho', teamB: 'Time Azul',    goalsA: 2, goalsB: 0, winner: 'A' },
      { teamA: 'Time Verde',    teamB: 'Time Amarelo', goalsA: 1, goalsB: 1, winner: 'draw' },
      { teamA: 'Time Vermelho', teamB: 'Time Amarelo', goalsA: 3, goalsB: 1, winner: 'A' },
      { teamA: 'Time Azul',     teamB: 'Time Verde',   goalsA: 2, goalsB: 1, winner: 'A' },
      { teamA: 'Time Vermelho', teamB: 'Time Azul',    goalsA: 1, goalsB: 0, winner: 'A' },
    ],
  },
]

// ─── Rodada atual ─────────────────────────────────────────────
export const mockRodada = {
  id: 'mock-rodada-1',
  data_jogo: '2026-03-30',
  status: 'encerrada', // aguardando | aberta | sorteada | em_jogo | encerrada
}

// ─── Histórico de partidas (mock para testar tela encerrada) ──
export const mockMatchHistory = [
  {
    teamA: { nome: 'Time Azul' },
    teamB: { nome: 'Time Vermelho' },
    goalsA: 3, goalsB: 1, winner: 'A',
    events: [
      { type: 'gol',        player: { id: 'u01', nome: 'Carlos Silva' } },
      { type: 'gol',        player: { id: 'u01', nome: 'Carlos Silva' } },
      { type: 'gol',        player: { id: 'u03', nome: 'Pedro Oliveira' } },
      { type: 'assistencia', player: { id: 'u02', nome: 'João Santos' } },
      { type: 'gol',        player: { id: 'u04', nome: 'Lucas Costa' } },
      { type: 'assistencia', player: { id: 'u02', nome: 'João Santos' } },
    ],
  },
  {
    teamA: { nome: 'Time Amarelo' },
    teamB: { nome: 'Time Verde' },
    goalsA: 2, goalsB: 2, winner: 'draw',
    events: [
      { type: 'gol',        player: { id: 'u05', nome: 'Gabriel Souza' } },
      { type: 'gol',        player: { id: 'u05', nome: 'Gabriel Souza' } },
      { type: 'assistencia', player: { id: 'u06', nome: 'Matheus Lima' } },
      { type: 'gol',        player: { id: 'u07', nome: 'Rafael Ferreira' } },
      { type: 'gol',        player: { id: 'u08', nome: 'André Rodrigues' } },
    ],
  },
  {
    teamA: { nome: 'Time Azul' },
    teamB: { nome: 'Time Amarelo' },
    goalsA: 1, goalsB: 2, winner: 'B',
    events: [
      { type: 'gol',        player: { id: 'u09', nome: 'Felipe Alves' } },
      { type: 'gol',        player: { id: 'u05', nome: 'Gabriel Souza' } },
      { type: 'gol',        player: { id: 'u01', nome: 'Carlos Silva' } },
      { type: 'assistencia', player: { id: 'u02', nome: 'João Santos' } },
    ],
  },
]

// ─── Presenças (admin na posição 1 — comportamento esperado) ──
// Lista: admin (pos 1) + u01–u11 (pos 2–12) = 12 confirmados
// Fila:  u12–u15 (pos 21–24)
export const mockPresencas = [
  { id: 'pr00', rodada_id: 'mock-rodada-1', usuario_id: 'u-admin', posicao: 1,  status: 'pago',       profiles: mockCurrentUser },
  { id: 'pr01', rodada_id: 'mock-rodada-1', usuario_id: 'u01',     posicao: 2,  status: 'pago',       profiles: mockPlayers[0]  },
  { id: 'pr02', rodada_id: 'mock-rodada-1', usuario_id: 'u02',     posicao: 3,  status: 'pago',       profiles: mockPlayers[1]  },
  { id: 'pr03', rodada_id: 'mock-rodada-1', usuario_id: 'u03',     posicao: 4,  status: 'pago',       profiles: mockPlayers[2]  },
  { id: 'pr04', rodada_id: 'mock-rodada-1', usuario_id: 'u04',     posicao: 5,  status: 'pago',       profiles: mockPlayers[3]  },
  { id: 'pr05', rodada_id: 'mock-rodada-1', usuario_id: 'u05',     posicao: 6,  status: 'confirmado', profiles: mockPlayers[4]  },
  { id: 'pr06', rodada_id: 'mock-rodada-1', usuario_id: 'u06',     posicao: 7,  status: 'confirmado', profiles: mockPlayers[5]  },
  { id: 'pr07', rodada_id: 'mock-rodada-1', usuario_id: 'u07',     posicao: 8,  status: 'confirmado', profiles: mockPlayers[6]  },
  { id: 'pr08', rodada_id: 'mock-rodada-1', usuario_id: 'u08',     posicao: 9,  status: 'confirmado', profiles: mockPlayers[7]  },
  { id: 'pr09', rodada_id: 'mock-rodada-1', usuario_id: 'u09',     posicao: 10, status: 'confirmado', profiles: mockPlayers[8]  },
  { id: 'pr10', rodada_id: 'mock-rodada-1', usuario_id: 'u10',     posicao: 11, status: 'confirmado', profiles: mockPlayers[9]  },
  { id: 'pr11', rodada_id: 'mock-rodada-1', usuario_id: 'u11',     posicao: 12, status: 'confirmado', profiles: mockPlayers[10] },
  { id: 'pr12', rodada_id: 'mock-rodada-1', usuario_id: 'u12',     posicao: 21, status: 'espera',     profiles: mockPlayers[11] },
  { id: 'pr13', rodada_id: 'mock-rodada-1', usuario_id: 'u13',     posicao: 22, status: 'espera',     profiles: mockPlayers[12] },
  { id: 'pr14', rodada_id: 'mock-rodada-1', usuario_id: 'u14',     posicao: 23, status: 'espera',     profiles: mockPlayers[13] },
  { id: 'pr15', rodada_id: 'mock-rodada-1', usuario_id: 'u15',     posicao: 24, status: 'espera',     profiles: mockPlayers[14] },
]

// ─── Feed social ──────────────────────────────────────────────
export const mockFeedPosts = [
  {
    id: 'post-1',
    autor_id: 'u-admin',
    legenda: 'Que jogo incrível hoje! Time azul arrasando 🔵⚽',
    imagem_url: 'https://placehold.co/400x500/1F2937/00C853?text=Foto+do+Jogo',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min atrás
    profiles: { id: 'u-admin', nome: 'Leonardo Salvador', foto_url: null },
    feed_comentarios: [{ count: 3 }],
  },
  {
    id: 'post-2',
    autor_id: 'u-admin',
    legenda: 'Galera reunida pra mais uma pelada 💪🏽 Sexta que vem tem mais!',
    imagem_url: 'https://placehold.co/400x500/1F2937/FFD600?text=Pelada+da+Semana',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5h atrás
    profiles: { id: 'u-admin', nome: 'Leonardo Salvador', foto_url: null },
    feed_comentarios: [{ count: 1 }],
  },
  {
    id: 'post-3',
    autor_id: 'u-admin',
    legenda: null,
    imagem_url: 'https://placehold.co/400x500/1F2937/EF4444?text=Gol+do+Mes',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 dia atrás
    profiles: { id: 'u-admin', nome: 'Leonardo Salvador', foto_url: null },
    feed_comentarios: [{ count: 0 }],
  },
]

export const mockFeedComentarios = {
  'post-1': [
    { id: 'c1', post_id: 'post-1', autor_id: 'u01', texto: 'Demais! Quero ver o gol do Carlos 🔥', created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(), profiles: { id: 'u01', nome: 'Carlos Silva', foto_url: null } },
    { id: 'c2', post_id: 'post-1', autor_id: 'u02', texto: 'Rodada top demais, voltando forte semana que vem', created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(), profiles: { id: 'u02', nome: 'João Santos', foto_url: null } },
    { id: 'c3', post_id: 'post-1', autor_id: 'u03', texto: '👏👏👏', created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(), profiles: { id: 'u03', nome: 'Pedro Oliveira', foto_url: null } },
  ],
  'post-2': [
    { id: 'c4', post_id: 'post-2', autor_id: 'u04', texto: 'Tô dentro na sexta!', created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), profiles: { id: 'u04', nome: 'Lucas Costa', foto_url: null } },
  ],
  'post-3': [],
}

// ─── Ciclo de votação ─────────────────────────────────────────
export const mockCiclo = {
  id: 'ciclo-mock-1',
  aberta: true,
}

// ─── Campeonato ───────────────────────────────────────────────
const TIMES = {
  'T-A1': { id: 'T-A1', campeonato_id: 'CAMP-1', nome: 'Feras do Bagre',  cor: '#EF4444', grupo: 'A' },
  'T-A2': { id: 'T-A2', campeonato_id: 'CAMP-1', nome: 'Raios do Campo',  cor: '#3B82F6', grupo: 'A' },
  'T-A3': { id: 'T-A3', campeonato_id: 'CAMP-1', nome: 'Trovões FC',      cor: '#F59E0B', grupo: 'A' },
  'T-B1': { id: 'T-B1', campeonato_id: 'CAMP-1', nome: 'Cobras Negras',   cor: '#10B981', grupo: 'B' },
  'T-B2': { id: 'T-B2', campeonato_id: 'CAMP-1', nome: 'Leões do Sul',    cor: '#8B5CF6', grupo: 'B' },
  'T-B3': { id: 'T-B3', campeonato_id: 'CAMP-1', nome: 'Águias do Norte', cor: '#EC4899', grupo: 'B' },
}

const PLAYERS_SHORT = {
  'u01': { id: 'u01', nome: 'Carlos Silva',       foto_url: null },
  'u02': { id: 'u02', nome: 'João Santos',         foto_url: null },
  'u03': { id: 'u03', nome: 'Pedro Oliveira',      foto_url: null },
  'u04': { id: 'u04', nome: 'Lucas Costa',         foto_url: null },
  'u05': { id: 'u05', nome: 'Gabriel Souza',       foto_url: null },
  'u06': { id: 'u06', nome: 'Matheus Lima',        foto_url: null },
  'u07': { id: 'u07', nome: 'Rafael Ferreira',     foto_url: null },
  'u08': { id: 'u08', nome: 'André Rodrigues',     foto_url: null },
  'u09': { id: 'u09', nome: 'Felipe Alves',        foto_url: null },
  'u10': { id: 'u10', nome: 'Bruno Martins',       foto_url: null },
  'u11': { id: 'u11', nome: 'Diego Pereira',       foto_url: null },
  'u12': { id: 'u12', nome: 'Thiago Gomes',        foto_url: null },
  'u13': { id: 'u13', nome: 'Leandro Ribeiro',     foto_url: null },
  'u14': { id: 'u14', nome: 'Rodrigo Carvalho',    foto_url: null },
  'u15': { id: 'u15', nome: 'Marcelo Nascimento',  foto_url: null },
  'u16': { id: 'u16', nome: 'Gustavo Araújo',      foto_url: null },
  'u17': { id: 'u17', nome: 'Vinícius Mendes',     foto_url: null },
  'u18': { id: 'u18', nome: 'Eduardo Cardoso',     foto_url: null },
  'u19': { id: 'u19', nome: 'Leonardo Barbosa',    foto_url: null },
  'u20': { id: 'u20', nome: 'Henrique Moreira',    foto_url: null },
  'u21': { id: 'u21', nome: 'Fábio Teixeira',      foto_url: null },
  'u22': { id: 'u22', nome: 'Igor Nascimento',     foto_url: null },
  'u-admin': { id: 'u-admin', nome: 'Leonardo Salvador', foto_url: null },
}

export const mockCampeonato = {
  id: 'CAMP-1', nome: 'Copa Bagres #1',
  status: 'em_andamento', visivel: true, fase_atual: 'grupos',
  created_by: 'u-admin', created_at: '2026-06-01T10:00:00Z',
}

export const mockCampeonatoTimes = [
  {
    ...TIMES['T-A1'],
    campeonato_time_jogadores: [
      { jogador_id: 'u01', profiles: PLAYERS_SHORT['u01'] },
      { jogador_id: 'u02', profiles: PLAYERS_SHORT['u02'] },
      { jogador_id: 'u03', profiles: PLAYERS_SHORT['u03'] },
      { jogador_id: 'u04', profiles: PLAYERS_SHORT['u04'] },
    ],
  },
  {
    ...TIMES['T-A2'],
    campeonato_time_jogadores: [
      { jogador_id: 'u05', profiles: PLAYERS_SHORT['u05'] },
      { jogador_id: 'u06', profiles: PLAYERS_SHORT['u06'] },
      { jogador_id: 'u07', profiles: PLAYERS_SHORT['u07'] },
      { jogador_id: 'u08', profiles: PLAYERS_SHORT['u08'] },
    ],
  },
  {
    ...TIMES['T-A3'],
    campeonato_time_jogadores: [
      { jogador_id: 'u09', profiles: PLAYERS_SHORT['u09'] },
      { jogador_id: 'u10', profiles: PLAYERS_SHORT['u10'] },
      { jogador_id: 'u11', profiles: PLAYERS_SHORT['u11'] },
      { jogador_id: 'u12', profiles: PLAYERS_SHORT['u12'] },
    ],
  },
  {
    ...TIMES['T-B1'],
    campeonato_time_jogadores: [
      { jogador_id: 'u13', profiles: PLAYERS_SHORT['u13'] },
      { jogador_id: 'u14', profiles: PLAYERS_SHORT['u14'] },
      { jogador_id: 'u15', profiles: PLAYERS_SHORT['u15'] },
      { jogador_id: 'u16', profiles: PLAYERS_SHORT['u16'] },
    ],
  },
  {
    ...TIMES['T-B2'],
    campeonato_time_jogadores: [
      { jogador_id: 'u17', profiles: PLAYERS_SHORT['u17'] },
      { jogador_id: 'u18', profiles: PLAYERS_SHORT['u18'] },
      { jogador_id: 'u19', profiles: PLAYERS_SHORT['u19'] },
      { jogador_id: 'u20', profiles: PLAYERS_SHORT['u20'] },
    ],
  },
  {
    ...TIMES['T-B3'],
    campeonato_time_jogadores: [
      { jogador_id: 'u21', profiles: PLAYERS_SHORT['u21'] },
      { jogador_id: 'u22', profiles: PLAYERS_SHORT['u22'] },
      { jogador_id: 'u-admin', profiles: PLAYERS_SHORT['u-admin'] },
    ],
  },
]

// Partidas: 6 encerradas, 1 ao vivo, 2 agendadas
export const mockCampeonatoPartidas = [
  // Rodada 1
  { id: 'P01', campeonato_id: 'CAMP-1', fase: 'grupos', rodada_num: 1, ordem: 1, time_casa_id: 'T-A1', time_visitante_id: 'T-B1', gols_casa: 2, gols_visitante: 1, half_atual: 0, status: 'encerrada', votacao_mvp_aberta: false, mvp_id: 'u01', penaltis_casa: null, penaltis_visitante: null, time_casa: TIMES['T-A1'], time_visitante: TIMES['T-B1'], mvp: PLAYERS_SHORT['u01'] },
  { id: 'P02', campeonato_id: 'CAMP-1', fase: 'grupos', rodada_num: 1, ordem: 2, time_casa_id: 'T-A2', time_visitante_id: 'T-B2', gols_casa: 1, gols_visitante: 1, half_atual: 0, status: 'encerrada', votacao_mvp_aberta: false, mvp_id: 'u17', penaltis_casa: null, penaltis_visitante: null, time_casa: TIMES['T-A2'], time_visitante: TIMES['T-B2'], mvp: PLAYERS_SHORT['u17'] },
  { id: 'P03', campeonato_id: 'CAMP-1', fase: 'grupos', rodada_num: 1, ordem: 3, time_casa_id: 'T-A3', time_visitante_id: 'T-B3', gols_casa: 0, gols_visitante: 2, half_atual: 0, status: 'encerrada', votacao_mvp_aberta: false, mvp_id: 'u21', penaltis_casa: null, penaltis_visitante: null, time_casa: TIMES['T-A3'], time_visitante: TIMES['T-B3'], mvp: PLAYERS_SHORT['u21'] },
  // Rodada 2
  { id: 'P04', campeonato_id: 'CAMP-1', fase: 'grupos', rodada_num: 2, ordem: 4, time_casa_id: 'T-A1', time_visitante_id: 'T-B2', gols_casa: 3, gols_visitante: 0, half_atual: 0, status: 'encerrada', votacao_mvp_aberta: false, mvp_id: 'u01', penaltis_casa: null, penaltis_visitante: null, time_casa: TIMES['T-A1'], time_visitante: TIMES['T-B2'], mvp: PLAYERS_SHORT['u01'] },
  { id: 'P05', campeonato_id: 'CAMP-1', fase: 'grupos', rodada_num: 2, ordem: 5, time_casa_id: 'T-A2', time_visitante_id: 'T-B3', gols_casa: 2, gols_visitante: 1, half_atual: 0, status: 'encerrada', votacao_mvp_aberta: true,  mvp_id: null,   penaltis_casa: null, penaltis_visitante: null, time_casa: TIMES['T-A2'], time_visitante: TIMES['T-B3'], mvp: null },
  { id: 'P06', campeonato_id: 'CAMP-1', fase: 'grupos', rodada_num: 2, ordem: 6, time_casa_id: 'T-A3', time_visitante_id: 'T-B1', gols_casa: 1, gols_visitante: 2, half_atual: 0, status: 'encerrada', votacao_mvp_aberta: false, mvp_id: 'u13', penaltis_casa: null, penaltis_visitante: null, time_casa: TIMES['T-A3'], time_visitante: TIMES['T-B1'], mvp: PLAYERS_SHORT['u13'] },
  // Rodada 3 — 1 ao vivo, 2 agendadas
  { id: 'P07', campeonato_id: 'CAMP-1', fase: 'grupos', rodada_num: 3, ordem: 7, time_casa_id: 'T-A1', time_visitante_id: 'T-B3', gols_casa: 1, gols_visitante: 1, half_atual: 1, status: 'em_andamento', votacao_mvp_aberta: false, mvp_id: null, penaltis_casa: null, penaltis_visitante: null, timer_end_ts: null, timer_paused_secs: 180, time_casa: TIMES['T-A1'], time_visitante: TIMES['T-B3'], mvp: null },
  { id: 'P08', campeonato_id: 'CAMP-1', fase: 'grupos', rodada_num: 3, ordem: 8, time_casa_id: 'T-A2', time_visitante_id: 'T-B1', gols_casa: 0, gols_visitante: 0, half_atual: 0, status: 'agendada',     votacao_mvp_aberta: false, mvp_id: null, penaltis_casa: null, penaltis_visitante: null, time_casa: TIMES['T-A2'], time_visitante: TIMES['T-B1'], mvp: null },
  { id: 'P09', campeonato_id: 'CAMP-1', fase: 'grupos', rodada_num: 3, ordem: 9, time_casa_id: 'T-A3', time_visitante_id: 'T-B2', gols_casa: 0, gols_visitante: 0, half_atual: 0, status: 'agendada',     votacao_mvp_aberta: false, mvp_id: null, penaltis_casa: null, penaltis_visitante: null, time_casa: TIMES['T-A3'], time_visitante: TIMES['T-B2'], mvp: null },
]

// Gols e assistências das partidas encerradas
export const mockCampeonatoEventos = [
  // P01: Feras 2-1 Cobras
  { id: 'E01', partida_id: 'P01', campeonato_id: 'CAMP-1', jogador_id: 'u01', time_id: 'T-A1', tipo: 'gol',         minuto: 3, half: 1, profiles: PLAYERS_SHORT['u01'], campeonato_times: TIMES['T-A1'] },
  { id: 'E02', partida_id: 'P01', campeonato_id: 'CAMP-1', jogador_id: 'u02', time_id: 'T-A1', tipo: 'gol',         minuto: 7, half: 2, profiles: PLAYERS_SHORT['u02'], campeonato_times: TIMES['T-A1'] },
  { id: 'E03', partida_id: 'P01', campeonato_id: 'CAMP-1', jogador_id: 'u03', time_id: 'T-A1', tipo: 'assistencia', minuto: 7, half: 2, profiles: PLAYERS_SHORT['u03'], campeonato_times: TIMES['T-A1'] },
  { id: 'E04', partida_id: 'P01', campeonato_id: 'CAMP-1', jogador_id: 'u13', time_id: 'T-B1', tipo: 'gol',         minuto: 9, half: 2, profiles: PLAYERS_SHORT['u13'], campeonato_times: TIMES['T-B1'] },
  // P02: Raios 1-1 Leões
  { id: 'E05', partida_id: 'P02', campeonato_id: 'CAMP-1', jogador_id: 'u05', time_id: 'T-A2', tipo: 'gol',         minuto: 4, half: 1, profiles: PLAYERS_SHORT['u05'], campeonato_times: TIMES['T-A2'] },
  { id: 'E06', partida_id: 'P02', campeonato_id: 'CAMP-1', jogador_id: 'u06', time_id: 'T-A2', tipo: 'assistencia', minuto: 4, half: 1, profiles: PLAYERS_SHORT['u06'], campeonato_times: TIMES['T-A2'] },
  { id: 'E07', partida_id: 'P02', campeonato_id: 'CAMP-1', jogador_id: 'u17', time_id: 'T-B2', tipo: 'gol',         minuto: 8, half: 2, profiles: PLAYERS_SHORT['u17'], campeonato_times: TIMES['T-B2'] },
  // P03: Trovões 0-2 Águias
  { id: 'E08', partida_id: 'P03', campeonato_id: 'CAMP-1', jogador_id: 'u21', time_id: 'T-B3', tipo: 'gol',         minuto: 2, half: 1, profiles: PLAYERS_SHORT['u21'], campeonato_times: TIMES['T-B3'] },
  { id: 'E09', partida_id: 'P03', campeonato_id: 'CAMP-1', jogador_id: 'u22', time_id: 'T-B3', tipo: 'gol',         minuto: 6, half: 2, profiles: PLAYERS_SHORT['u22'], campeonato_times: TIMES['T-B3'] },
  { id: 'E10', partida_id: 'P03', campeonato_id: 'CAMP-1', jogador_id: 'u21', time_id: 'T-B3', tipo: 'assistencia', minuto: 6, half: 2, profiles: PLAYERS_SHORT['u21'], campeonato_times: TIMES['T-B3'] },
  // P04: Feras 3-0 Leões
  { id: 'E11', partida_id: 'P04', campeonato_id: 'CAMP-1', jogador_id: 'u01', time_id: 'T-A1', tipo: 'gol',         minuto: 1, half: 1, profiles: PLAYERS_SHORT['u01'], campeonato_times: TIMES['T-A1'] },
  { id: 'E12', partida_id: 'P04', campeonato_id: 'CAMP-1', jogador_id: 'u01', time_id: 'T-A1', tipo: 'gol',         minuto: 4, half: 1, profiles: PLAYERS_SHORT['u01'], campeonato_times: TIMES['T-A1'] },
  { id: 'E13', partida_id: 'P04', campeonato_id: 'CAMP-1', jogador_id: 'u04', time_id: 'T-A1', tipo: 'gol',         minuto: 9, half: 2, profiles: PLAYERS_SHORT['u04'], campeonato_times: TIMES['T-A1'] },
  { id: 'E14', partida_id: 'P04', campeonato_id: 'CAMP-1', jogador_id: 'u02', time_id: 'T-A1', tipo: 'assistencia', minuto: 9, half: 2, profiles: PLAYERS_SHORT['u02'], campeonato_times: TIMES['T-A1'] },
  // P05: Raios 2-1 Águias (votação aberta)
  { id: 'E15', partida_id: 'P05', campeonato_id: 'CAMP-1', jogador_id: 'u05', time_id: 'T-A2', tipo: 'gol',         minuto: 3, half: 1, profiles: PLAYERS_SHORT['u05'], campeonato_times: TIMES['T-A2'] },
  { id: 'E16', partida_id: 'P05', campeonato_id: 'CAMP-1', jogador_id: 'u07', time_id: 'T-A2', tipo: 'assistencia', minuto: 3, half: 1, profiles: PLAYERS_SHORT['u07'], campeonato_times: TIMES['T-A2'] },
  { id: 'E17', partida_id: 'P05', campeonato_id: 'CAMP-1', jogador_id: 'u06', time_id: 'T-A2', tipo: 'gol',         minuto: 8, half: 2, profiles: PLAYERS_SHORT['u06'], campeonato_times: TIMES['T-A2'] },
  { id: 'E18', partida_id: 'P05', campeonato_id: 'CAMP-1', jogador_id: 'u21', time_id: 'T-B3', tipo: 'gol',         minuto: 5, half: 2, profiles: PLAYERS_SHORT['u21'], campeonato_times: TIMES['T-B3'] },
  // P06: Trovões 1-2 Cobras
  { id: 'E19', partida_id: 'P06', campeonato_id: 'CAMP-1', jogador_id: 'u09', time_id: 'T-A3', tipo: 'gol',         minuto: 3, half: 1, profiles: PLAYERS_SHORT['u09'], campeonato_times: TIMES['T-A3'] },
  { id: 'E20', partida_id: 'P06', campeonato_id: 'CAMP-1', jogador_id: 'u13', time_id: 'T-B1', tipo: 'gol',         minuto: 6, half: 2, profiles: PLAYERS_SHORT['u13'], campeonato_times: TIMES['T-B1'] },
  { id: 'E21', partida_id: 'P06', campeonato_id: 'CAMP-1', jogador_id: 'u14', time_id: 'T-B1', tipo: 'assistencia', minuto: 6, half: 2, profiles: PLAYERS_SHORT['u14'], campeonato_times: TIMES['T-B1'] },
  { id: 'E22', partida_id: 'P06', campeonato_id: 'CAMP-1', jogador_id: 'u14', time_id: 'T-B1', tipo: 'gol',         minuto: 9, half: 2, profiles: PLAYERS_SHORT['u14'], campeonato_times: TIMES['T-B1'] },
  // P07: Feras 1-1 Águias (ao vivo)
  { id: 'E23', partida_id: 'P07', campeonato_id: 'CAMP-1', jogador_id: 'u01', time_id: 'T-A1', tipo: 'gol',           minuto: 2, half: 1, profiles: PLAYERS_SHORT['u01'], campeonato_times: TIMES['T-A1'] },
  { id: 'E24', partida_id: 'P07', campeonato_id: 'CAMP-1', jogador_id: 'u21', time_id: 'T-B3', tipo: 'gol',           minuto: 4, half: 1, profiles: PLAYERS_SHORT['u21'], campeonato_times: TIMES['T-B3'] },
  { id: 'E25', partida_id: 'P07', campeonato_id: 'CAMP-1', jogador_id: 'u03', time_id: 'T-A1', tipo: 'cartao_amarelo', minuto: 3, half: 1, profiles: PLAYERS_SHORT['u03'], campeonato_times: TIMES['T-A1'] },
]

// Jogadores extraídos com time_id (shape do context)
export const mockCampeonatoJogadores = [
  ...mockCampeonatoTimes.flatMap(t =>
    t.campeonato_time_jogadores.map(tj => ({ ...tj.profiles, time_id: t.id }))
  )
]
