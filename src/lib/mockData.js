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
  status: 'aberta', // aguardando | aberta | sorteada | em_jogo | encerrada
}

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

// ─── Ciclo de votação ─────────────────────────────────────────
export const mockCiclo = {
  id: 'ciclo-mock-1',
  aberta: true,
}
