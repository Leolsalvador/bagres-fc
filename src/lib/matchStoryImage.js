// Gera um PNG simples (via canvas, sem fotos) com o resultado de uma
// partida — pra postar automaticamente como Story sempre que uma
// partida termina. Só texto, então não depende de CORS/fotos externas.

function fitFontSize(ctx, text, maxWidth, baseSize, weight) {
  let size = baseSize
  ctx.font = `${weight} ${size}px Inter, sans-serif`
  while (ctx.measureText(text).width > maxWidth && size > 20) {
    size -= 2
    ctx.font = `${weight} ${size}px Inter, sans-serif`
  }
  return size
}

// Agrupa nomes repetidos: ['Fulano','Fulano','Beltrano'] -> ['Fulano (2)','Beltrano']
function summarizeNames(names) {
  const counts = {}
  const order = []
  names.forEach(nome => {
    const key = nome || 'Convidado'
    if (!counts[key]) { counts[key] = 0; order.push(key) }
    counts[key]++
  })
  return order.map(nome => counts[nome] > 1 ? `${nome} (${counts[nome]})` : nome)
}

export async function generateMatchStoryImage({ teamA, teamB, golsA, golsB, scorerNames = [], assisterNames = [] }) {
  const W = 720, H = 1280
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#111827')
  grad.addColorStop(1, '#0D0D0D')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  ctx.textAlign = 'center'

  // Cabeçalho
  ctx.font = '700 30px Inter, sans-serif'
  ctx.fillStyle = '#9CA3AF'
  ctx.fillText('⚽ FIM DE JOGO', W / 2, 140)

  // Time A
  const sizeA = fitFontSize(ctx, teamA, W - 100, 46, 900)
  ctx.font = `900 ${sizeA}px Inter, sans-serif`
  ctx.fillStyle = '#F9FAFB'
  ctx.fillText(teamA, W / 2, 250)

  // Placar
  ctx.font = '900 130px Inter, sans-serif'
  ctx.fillStyle = '#00C853'
  ctx.fillText(`${golsA} × ${golsB}`, W / 2, 420)

  // Time B
  const sizeB = fitFontSize(ctx, teamB, W - 100, 46, 900)
  ctx.font = `900 ${sizeB}px Inter, sans-serif`
  ctx.fillStyle = '#F9FAFB'
  ctx.fillText(teamB, W / 2, 500)

  // Divisor
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(80, 580)
  ctx.lineTo(W - 80, 580)
  ctx.stroke()

  // Gols / Assistências
  ctx.textAlign = 'left'
  let y = 660

  function drawSection(title, names, emptyLabel) {
    ctx.font = '700 32px Inter, sans-serif'
    ctx.fillStyle = '#FFD600'
    ctx.fillText(title, 70, y)
    y += 52
    ctx.font = '600 30px Inter, sans-serif'
    const list = summarizeNames(names)
    if (list.length === 0) {
      ctx.fillStyle = '#9CA3AF'
      ctx.fillText(emptyLabel, 70, y)
      y += 46
    } else {
      list.forEach(nome => {
        ctx.fillStyle = '#F9FAFB'
        ctx.fillText(nome, 70, y)
        y += 46
      })
    }
    y += 40
  }

  drawSection('⚽ Gols', scorerNames, 'Ninguém balançou a rede')
  drawSection('🅰️ Assistências', assisterNames, 'Nenhuma assistência')

  // Rodapé
  ctx.textAlign = 'center'
  ctx.font = '600 22px Inter, sans-serif'
  ctx.fillStyle = '#9CA3AF'
  ctx.fillText('Bagres FC', W / 2, H - 60)

  return await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
}
