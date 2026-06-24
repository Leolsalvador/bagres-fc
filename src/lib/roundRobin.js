/**
 * Gera a tabela de jogos para o formato cruzado (Grupo A vs Grupo B).
 * Cada time do Grupo A enfrenta cada time do Grupo B.
 * Garante que o mesmo time não jogue em partidas consecutivas.
 */
export function generateCrossGroupSchedule(groupA, groupB) {
  // Gera todos os confrontos A × B
  const allMatches = []
  groupA.forEach(ta => {
    groupB.forEach(tb => {
      allMatches.push({ timeCasaId: ta.id, timeVisitanteId: tb.id })
    })
  })

  // Ordena para minimizar aparições consecutivas do mesmo time
  const sorted = [allMatches[0]]
  const remaining = [...allMatches.slice(1)]

  while (remaining.length > 0) {
    const last = sorted[sorted.length - 1]
    const usedTeams = new Set([last.timeCasaId, last.timeVisitanteId])

    const idx = remaining.findIndex(
      m => !usedTeams.has(m.timeCasaId) && !usedTeams.has(m.timeVisitanteId)
    )

    sorted.push(idx >= 0 ? remaining.splice(idx, 1)[0] : remaining.shift())
  }

  return sorted.map((m, i) => ({
    ...m,
    ordem: i + 1,
    rodadaNum: Math.floor(i / Math.max(groupA.length, groupB.length)) + 1,
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
