/**
 * Sorteia 4 times de 5 jogadores balanceados pelo rating.
 * Goleiros (GOL) são separados e não entram no sorteio.
 * Algoritmo base: Snake Draft — distribui do melhor ao pior em zigue-zague.
 * Após o draft, tenta minimizar jogadores da mesma posição no mesmo time (soft constraint),
 * respeitando o limite de diferença de rating para não desbalancear os times.
 */
export function drawTeams(players) {
  const outfield = players.filter(p => p?.posicao_campo !== 'GOL')

  // Adiciona ruído aleatório pequeno aos ratings para garantir times diferentes
  // a cada ressortear, mantendo o balanceamento geral
  const sorted = [...outfield]
    .map(p => ({ ...p, _sortKey: (p?.rating ?? 0) + (Math.random() - 0.5) * 0.6 }))
    .sort((a, b) => b._sortKey - a._sortKey)

  const teams    = [[], [], [], []]
  const order    = [0, 1, 2, 3, 3, 2, 1, 0, 0, 1, 2, 3, 3, 2, 1, 0, 0, 1, 2, 3]

  sorted.forEach((player, i) => {
    teams[order[i]].push(player)
  })

  // Tenta trocar jogadores entre times para reduzir conflitos de posição (soft),
  // mas apenas entre jogadores com ratings próximos para não desbalancear
  balancePositions(teams)

  return teams.map((players, i) => ({
    numero: i + 1,
    nome: `Time ${i + 1}`,
    players,
    ratingMedio: players.length
      ? players.reduce((s, p) => s + (p?.rating ?? 0), 0) / players.length
      : 0,
  }))
}

/**
 * Tenta trocar jogadores entre times para reduzir duplicatas de posição.
 * Só troca jogadores com diferença de rating ≤ 0.5 para preservar o balanceamento.
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
            if (!pa?.posicao_campo || !pb?.posicao_campo) continue
            if (pa.posicao_campo === pb.posicao_campo) continue
            // Só troca se os ratings forem parecidos para não desbalancear
            if (Math.abs((pa?.rating ?? 0) - (pb?.rating ?? 0)) > 0.5) continue

            const before = conflicts(teams[a]) + conflicts(teams[b])
            teams[a][i] = pb
            teams[b][j] = pa
            const after = conflicts(teams[a]) + conflicts(teams[b])

            if (after < before) {
              improved = true
            } else {
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
    if (p?.posicao_campo && p.posicao_campo !== 'CORINGA') {
      count[p.posicao_campo] = (count[p.posicao_campo] ?? 0) + 1
    }
  })
  return Object.values(count).reduce((s, n) => s + Math.max(0, n - 1), 0)
}
