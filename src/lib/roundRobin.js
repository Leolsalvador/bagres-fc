/**
 * Gera a tabela de jogos para o formato cruzado (Grupo A vs Grupo B).
 * Cada time do Grupo A enfrenta cada time do Grupo B.
 *
 * Monta por rodadas: em cada rodada, cada time do grupo menor enfrenta um
 * time distinto do grupo maior (rotação circular), então nenhum time repete
 * dentro da rodada. Isso evita cair num "resto" só de um time no final —
 * o bug do algoritmo guloso anterior, que empacava e forçava o último time
 * a jogar várias partidas seguidas.
 */
export function generateCrossGroupSchedule(groupA, groupB) {
  const aIsBigger = groupA.length >= groupB.length
  const bigger  = aIsBigger ? groupA : groupB
  const smaller = aIsBigger ? groupB : groupA
  const m = smaller.length
  const n = bigger.length
  if (m === 0 || n === 0) return []

  const rounds = []
  for (let t = 0; t < n; t++) {
    const round = []
    for (let i = 0; i < m; i++) {
      const s = smaller[i]
      const b = bigger[(i + t) % n]
      round.push(aIsBigger
        ? { timeCasaId: b.id, timeVisitanteId: s.id }
        : { timeCasaId: s.id, timeVisitanteId: b.id })
    }
    rounds.push(round)
  }

  // Dentro de cada rodada nenhum time repete, então a ordem interna é livre —
  // usamos essa liberdade só para garantir que a última partida de uma rodada
  // e a primeira da próxima não compartilhem time.
  const ordered = []
  let last = null
  rounds.forEach(round => {
    const r = [...round]
    if (last) {
      const idx = r.findIndex(mm =>
        mm.timeCasaId !== last.timeCasaId && mm.timeCasaId !== last.timeVisitanteId &&
        mm.timeVisitanteId !== last.timeCasaId && mm.timeVisitanteId !== last.timeVisitanteId
      )
      if (idx > 0) { const [pick] = r.splice(idx, 1); r.unshift(pick) }
    }
    ordered.push(...r)
    last = r[r.length - 1]
  })

  return ordered.map((match, i) => ({
    ...match,
    ordem: i + 1,
    rodadaNum: Math.floor(i / m) + 1,
    fase: 'grupos',
  }))
}

/**
 * Calcula a classificação dentro de um grupo a partir das partidas encerradas.
 * Retorna array de times ordenado por pontos.
 */
export function calcularClassificacao(times, partidas) {
  return times.map(t => {
    const jogos = partidas.filter(p =>
      p.status === 'encerrada' &&
      p.fase === 'grupos' &&
      (p.time_casa_id === t.id || p.time_visitante_id === t.id)
    )

    let pts = 0, v = 0, e = 0, d = 0, gf = 0, gc = 0

    jogos.forEach(p => {
      const isCasa = p.time_casa_id === t.id
      const goalsFor = isCasa ? p.gols_casa : p.gols_visitante
      const goalsAgainst = isCasa ? p.gols_visitante : p.gols_casa

      gf += goalsFor
      gc += goalsAgainst

      if (goalsFor > goalsAgainst) { pts += 3; v++ }
      else if (goalsFor === goalsAgainst) { pts += 1; e++ }
      else { d++ }
    })

    return { ...t, pts, v, e, d, gf, gc, sg: gf - gc, j: jogos.length }
  }).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    if (b.sg !== a.sg) return b.sg - a.sg
    if (b.gf !== a.gf) return b.gf - a.gf
    return a.nome.localeCompare(b.nome)
  })
}
