/**
 * Sorteia 4 times de 5 jogadores balanceados pelo rating.
 * Algoritmo: Snake Draft — distribui do melhor ao pior em zigue-zague.
 * Os 4 com maior nota vão a times diferentes, depois os próximos 4, e assim por diante.
 */
export function drawTeams(players) {
  // Adiciona ruído aleatório pequeno para garantir times diferentes
  // a cada ressortear, mantendo o balanceamento geral
  const sorted = [...players]
    .map(p => ({ ...p, _sortKey: (p?.rating ?? 0) + (Math.random() - 0.5) * 0.6 }))
    .sort((a, b) => b._sortKey - a._sortKey)

  const teams = [[], [], [], []]
  const order = [0, 1, 2, 3, 3, 2, 1, 0, 0, 1, 2, 3, 3, 2, 1, 0, 0, 1, 2, 3]

  sorted.forEach((player, i) => {
    teams[order[i]].push(player)
  })

  return teams.map((players, i) => ({
    numero: i + 1,
    nome: `Time ${i + 1}`,
    players,
    ratingMedio: players.length
      ? players.reduce((s, p) => s + (p?.rating ?? 0), 0) / players.length
      : 0,
  }))
}
