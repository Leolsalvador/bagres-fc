/**
 * Sorteia 4 times de 5 jogadores balanceados pelo rating.
 * Goleiros (GOL) são separados e não entram no sorteio.
 * Algoritmo base: Snake Draft — distribui do melhor ao pior em zigue-zague.
 * Após o draft, tenta minimizar jogadores da mesma posição no mesmo time (soft constraint).
 */
export function drawTeams(players) {
  const outfield = players.filter(p => p.posicao_campo !== 'GOL')
  const sorted   = [...outfield].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  const teams    = [[], [], [], []]
  const order    = [0, 1, 2, 3, 3, 2, 1, 0, 0, 1, 2, 3, 3, 2, 1, 0, 0, 1, 2, 3]

  sorted.forEach((player, i) => {
    teams[order[i]].push(player)
  })

  // Tenta trocar jogadores entre times para reduzir conflitos de posição (soft)
  balancePositions(teams)

  return teams.map((players, i) => ({
    numero: i + 1,
    nome: `Time ${i + 1}`,
    players,
    ratingMedio: players.length
      ? players.reduce((s, p) => s + (p.rating ?? 0), 0) / players.length
      : 0,
  }))
}

/**
 * Tenta trocar jogadores entre times para reduzir duplicatas de posição.
 * Faz até 20 passes — não garante solução perfeita (é soft constraint).
 */
function balancePositions(teams) {
  for (let pass = 0; pass < 20; pass++) {
    let improved = false
    for (let a = 0; a < teams.length; a++) {
      for (let b = a + 1; b < teams.length; b++) {
        for (let i = 0; i < teams[a].length; i++) {
          for (let j = 0; j < teams[b].length; j++) {
            const pa = teams[a][i]
            const pb = teams[b][j]
            if (!pa.posicao_campo || !pb.posicao_campo) continue
            if (pa.posicao_campo === pb.posicao_campo) continue

            const before = conflicts(teams[a]) + conflicts(teams[b])
            // Simula troca
            teams[a][i] = pb
            teams[b][j] = pa
            const after = conflicts(teams[a]) + conflicts(teams[b])

            if (after < before) {
              improved = true // mantém a troca
            } else {
              // Desfaz
              teams[a][i] = pa
              teams[b][j] = pb
            }
          }
        }
      }
    }
    if (!improved) break
  }
}

function conflicts(team) {
  const count = {}
  team.forEach(p => {
    if (p.posicao_campo && p.posicao_campo !== 'CORINGA') {
      count[p.posicao_campo] = (count[p.posicao_campo] ?? 0) + 1
    }
  })
  return Object.values(count).reduce((s, n) => s + Math.max(0, n - 1), 0)
}
