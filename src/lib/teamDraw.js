/**
 * Sorteia 4 times de 5 jogadores balanceados pelo rating.
 * Algoritmo: Snake Draft — distribui do melhor ao pior em zigue-zague.
 *
 * Exemplo com 8 jogadores:
 * Ordenados: [P1, P2, P3, P4, P5, P6, P7, P8]
 * Round 1 →: T1=P1, T2=P2, T3=P3, T4=P4
 * Round 2 ←: T4=P5, T3=P6, T2=P7, T1=P8
 */
export function drawTeams(players) {
  const sorted = [...players].sort((a, b) => b.rating - a.rating)
  const teams = [[], [], [], []]
  const order = [0, 1, 2, 3, 3, 2, 1, 0, 0, 1, 2, 3, 3, 2, 1, 0, 0, 1, 2, 3]

  sorted.forEach((player, i) => {
    teams[order[i]].push(player)
  })

  return teams.map((players, i) => ({
    numero: i + 1,
    nome: `Time ${i + 1}`,
    players,
    ratingMedio: players.reduce((s, p) => s + p.rating, 0) / players.length,
  }))
}
